// A real, tiny RAG pipeline that runs in the browser. No network, no model.
// embed: sparse TF-IDF over word stems + char trigrams, d = |vocab|, L2-normalised
// retrieve: cosine top-k (optional metadata filter)
// rerank: MMR, lambda 0.7
// generate: compose the retrieved facts' approved lines, each with a citation
// evaluate: every claim must cite a retrieved chunk; every number in a claim
//           must appear in its cited source text

import { BEATS, FACTS, FACT_INDEX, type Beat, type ClusterId } from './corpus';

const TRIGRAM_W = 0.3;

const STOP = new Set(
  (
    'a an the of and or to in on for with at by as from is are was were be been being am do does did done ' +
    'has have had he his him i me my we us our you your it its this that these those what how why when where ' +
    'which should would could can will just so about tell anything any some there their them they she her ' +
    'please show give know get any more also then than into out up over'
  ).split(' ')
);

// Query rewrite: synonyms only map words to words that exist in the corpus.
const SYNONYMS: Record<string, string> = {
  hardware: 'hardware robot electronics',
  robots: 'robot',
  robot: 'robot hardware',
  shipped: 'shipped production live built',
  ship: 'shipped production',
  built: 'built shipped',
  build: 'build built',
  hire: 'hire results impact',
  experience: 'job role work',
  job: 'job role',
  work: 'job work',
  rag: 'rag retrieval grounding',
  agents: 'agents multi-agent',
  agent: 'agents',
  evals: 'evaluation evals',
  eval: 'evaluation evals',
  school: 'school education',
  study: 'education degree',
  studied: 'education degree',
  college: 'college education',
  lead: 'lead leadership',
  led: 'led leadership',
  leader: 'lead leadership',
  email: 'email contact',
  contact: 'contact reach',
  cv: 'resume',
  saif: 'saif whatsapp',
};

function stem(w: string) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss'))
    return w.slice(0, -1);
  return w;
}

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .split(' ')
    .map((w) => w.replace(/^\.+|\.+$/g, ''))
    .filter((w) => w.length > 0 && !STOP.has(w))
    .map(stem);
}

type Feat = { key: string; w: number };

function features(s: string): Feat[] {
  const out: Feat[] = [];
  for (const t of tokenize(s)) {
    out.push({ key: 'w:' + t, w: 1 });
    const p = `#${t}#`;
    if (p.length >= 5)
      for (let i = 0; i + 3 <= p.length; i++)
        out.push({ key: 'c:' + p.slice(i, i + 3), w: TRIGRAM_W });
  }
  return out;
}

function docSource(i: number) {
  const f = FACTS[i];
  return `${f.label} ${f.text} ${f.tags ?? ''} ${f.tags ?? ''}`;
}

// Vocabulary + IDF over the corpus. One dimension per feature, no hashing,
// so no collisions: d = |V|.
const DF = new Map<string, number>();
const N = FACTS.length;
FACTS.forEach((_, i) => {
  const seen = new Set(features(docSource(i)).map((f) => f.key));
  seen.forEach((k) => DF.set(k, (DF.get(k) ?? 0) + 1));
});
const VOCAB = new Map<string, number>([...DF.keys()].map((k, i) => [k, i]));
export const DIM = VOCAB.size;
export const VOCAB_WORDS = [...DF.keys()].filter((k) =>
  k.startsWith('w:')
).length;
const idf = (k: string) => Math.log((N + 1) / ((DF.get(k) ?? 0) + 1)) + 1;

export function embed(s: string): Float32Array {
  const v = new Float32Array(DIM);
  const tf = new Map<string, number>();
  for (const f of features(s)) tf.set(f.key, (tf.get(f.key) ?? 0) + 1);
  tf.forEach((w, k) => {
    const j = VOCAB.get(k);
    if (j === undefined) return;
    v[j] = (1 + Math.log(w)) * idf(k) * (k.startsWith('c:') ? TRIGRAM_W : 1);
  });
  let n = 0;
  for (let i = 0; i < DIM; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < DIM; i++) v[i] /= n;
  return v;
}

export function cosine(a: Float32Array, b: Float32Array) {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += a[i] * b[i];
  return d;
}

export const VECTORS: Float32Array[] = FACTS.map((_, i) => embed(docSource(i)));

// ── pipeline types
export type Hit = {
  fact: number;
  score: number;
  rank: number;
  rerank?: number;
  kept: boolean;
};
export type Claim = {
  text: string;
  fact: number;
  cite: number;
  href?: string;
  ok: boolean;
  numbers: string[];
};
export type Kind =
  | 'answer'
  | 'system'
  | 'abstain'
  | 'refuse'
  | 'temperature'
  | 'greet';

export type Run = {
  id: string;
  query: string;
  rewrite: string;
  filter?: ClusterId;
  kind: Kind;
  hits: Hit[];
  claims: Claim[];
  focus?: ClusterId;
  temperature?: number;
  eval: {
    cited: number;
    claims: number;
    nums: number;
    numsOk: number;
    pass: boolean;
    note: string;
  };
  ms: {
    embed: number;
    retrieve: number;
    rerank: number;
    generate: number;
    evaluate: number;
  };
  beat?: number;
};

const NUMBER_WORDS: Record<string, string> = {
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  seven: '7',
  ten: '10',
  twenty: '20',
  thirty: '30',
  forty: '40',
  fifty: '50',
  hundred: '100',
};

function numbersIn(s: string) {
  const out: string[] = [];
  const lower = s.toLowerCase();
  for (const m of lower.matchAll(/\d+(?:\.\d+)?/g)) out.push(m[0]);
  for (const w of lower.split(/[^a-z]+/))
    if (NUMBER_WORDS[w]) out.push(NUMBER_WORDS[w]);
  return out;
}

// LLM-ish evaluator, but deterministic: is every number in the claim present in its source?
function checkClaim(text: string, fact: number) {
  const src = new Set(numbersIn(FACTS[fact].text));
  const nums = numbersIn(text);
  return { nums, ok: nums.every((n) => src.has(n)) };
}

let runCounter = 0;
const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

function rewriteQuery(q: string) {
  const toks = q
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const extra: string[] = [];
  for (const t of toks) if (SYNONYMS[t]) extra.push(SYNONYMS[t]);
  return extra.length ? `${q} ${extra.join(' ')}` : q;
}

function evaluate(claims: Claim[], hits: Hit[]): Run['eval'] {
  const kept = new Set(hits.filter((h) => h.kept).map((h) => h.fact));
  let cited = 0,
    nums = 0,
    numsOk = 0;
  for (const c of claims) {
    const inCtx = kept.has(c.fact);
    const chk = checkClaim(c.text, c.fact);
    c.numbers = chk.nums;
    c.ok = inCtx && chk.ok;
    if (inCtx) cited++;
    nums += chk.nums.length;
    if (chk.ok) numsOk += chk.nums.length;
  }
  const pass = cited === claims.length && numsOk === nums;
  return {
    cited,
    claims: claims.length,
    nums,
    numsOk,
    pass,
    note: pass ? 'grounded' : 'regenerate',
  };
}

export type Special = {
  kind: 'refuse' | 'temperature' | 'greet' | 'system';
  value?: number;
};

export function detectSpecial(q: string): Special | null {
  const s = q.toLowerCase().trim();
  if (
    /ignore (all |any |the )?(previous|prior|above|earlier|your) (instructions|prompts?|rules)|jailbreak|developer mode|you are now|disregard (all|your|previous)/.test(
      s
    )
  )
    return { kind: 'refuse' };
  const t = s.match(
    /^(?:set\s+)?(?:temp(?:erature)?)\s*[=:]?\s*(-?\d+(?:\.\d+)?)/
  );
  if (t)
    return {
      kind: 'temperature',
      value: Math.max(0, Math.min(2, parseFloat(t[1]))),
    };
  if (
    /^(system|system prompt|show (me )?(the |your )?system prompt|\/system)$/.test(
      s
    )
  )
    return { kind: 'system' };
  if (/^(hi|hello|hey|yo|salam|hola)[!. ]*$/.test(s)) return { kind: 'greet' };
  return null;
}

const empty = () => ({
  embed: 0,
  retrieve: 0,
  rerank: 0,
  generate: 0,
  evaluate: 0,
});
const noEval = (note: string) => ({
  cited: 0,
  claims: 0,
  nums: 0,
  numsOk: 0,
  pass: true,
  note,
});

export function runQuery(
  query: string,
  opts: { filter?: ClusterId; k?: number; rewrite?: string; beat?: number } = {}
): Run {
  const id = `run_${(++runCounter).toString(36).padStart(3, '0')}`;
  const special = opts.beat === undefined ? detectSpecial(query) : null;
  if (special?.kind === 'system') return runBeat(0);
  if (special) {
    const claims: Claim[] = [];
    const kind = special.kind;
    return {
      id,
      query,
      rewrite: query,
      kind,
      hits: [],
      claims,
      temperature: special.value,
      eval: noEval(
        kind === 'refuse'
          ? 'injection blocked'
          : kind === 'temperature'
            ? 'sampling param'
            : 'no retrieval'
      ),
      ms: empty(),
    };
  }

  const ms = empty();
  let t = now();
  const rewrite = opts.rewrite ?? rewriteQuery(query);
  const qv = embed(rewrite);
  ms.embed = now() - t;

  t = now();
  const k = opts.k ?? 4;
  const cand = FACTS.map((f, i) => ({ fact: i, score: cosine(qv, VECTORS[i]) }))
    .filter((c) => !opts.filter || FACTS[c.fact].cluster === opts.filter)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  ms.retrieve = now() - t;

  const top = cand[0]?.score ?? 0;
  const hits: Hit[] = cand.map((c, rank) => ({ ...c, rank, kept: false }));

  if (top < 0.09) {
    return {
      id,
      query,
      rewrite,
      filter: opts.filter,
      kind: 'abstain',
      hits,
      claims: [],
      eval: noEval('abstained'),
      ms,
    };
  }

  // MMR
  t = now();
  const lambda = 0.7;
  const picked: number[] = [];
  const pool = hits.filter((h) => h.score >= top * 0.45);
  while (picked.length < Math.min(k, pool.length)) {
    let best = -1,
      bestV = -Infinity;
    for (let j = 0; j < pool.length; j++) {
      if (picked.includes(j)) continue;
      const red = picked.reduce(
        (m, p) =>
          Math.max(m, cosine(VECTORS[pool[j].fact], VECTORS[pool[p].fact])),
        0
      );
      const v = lambda * pool[j].score - (1 - lambda) * red;
      if (v > bestV) {
        bestV = v;
        best = j;
      }
    }
    picked.push(best);
  }
  picked.forEach((j, r) => {
    pool[j].kept = true;
    pool[j].rerank = r;
  });
  ms.rerank = now() - t;

  // generate: corpus order reads as a story
  t = now();
  const kept = hits.filter((h) => h.kept).sort((a, b) => a.fact - b.fact);
  const claims: Claim[] = kept.map((h) => ({
    text: FACTS[h.fact].line,
    fact: h.fact,
    cite: (h.rerank ?? 0) + 1,
    href: FACTS[h.fact].href,
    ok: false,
    numbers: [],
  }));
  ms.generate = now() - t;

  t = now();
  const ev = evaluate(claims, hits);
  ms.evaluate = now() - t;

  const counts = new Map<ClusterId, number>();
  kept.forEach((h) =>
    counts.set(
      FACTS[h.fact].cluster,
      (counts.get(FACTS[h.fact].cluster) ?? 0) + h.score
    )
  );
  const focus = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    id,
    query,
    rewrite,
    filter: opts.filter,
    kind: 'answer',
    hits,
    claims,
    focus,
    eval: ev,
    ms,
    beat: opts.beat,
  };
}

// Beat rewrites: query rewriting, shown in the trace. Words only, no claims.
const REWRITES: Record<string, string> = {
  who: 'who name role ai engineer agentic llm python visual think 3d fields',
  now: 'now current job company saif whatsapp photo 57 designs faster generation speed min',
  how: 'saif architecture langgraph multi-agent rag grounding validation agents check',
  ship: 'shipped built production search images automation deploy atomic sensei',
  hw: 'hardware robot arm vision gemini hackathon servo core xy paper',
  start: 'start first job intern backend api endpoints',
  lead: 'lead club tsig vice chair members projects classes 4pm',
  from: 'from where school dubai hyderabad education degree award',
  reach: 'contact reach email phone linkedin hire available roles',
};

export function runBeat(i: number): Run {
  const b: Beat = BEATS[i];
  if (b.system) {
    const t = now();
    const hits: Hit[] = b.system.map((s, r) => ({
      fact: FACT_INDEX[s.cite],
      score: 1,
      rank: r,
      rerank: r,
      kept: true,
    }));
    const claims: Claim[] = b.system.map((s, r) => ({
      text: s.text,
      fact: FACT_INDEX[s.cite],
      cite: r + 1,
      ok: false,
      numbers: [],
    }));
    const ev = evaluate(claims, hits);
    const ms = empty();
    ms.evaluate = now() - t;
    return {
      id: `run_${(++runCounter).toString(36).padStart(3, '0')}`,
      query: 'system',
      rewrite: 'pinned context',
      kind: 'system',
      hits,
      claims,
      focus: 'identity',
      eval: ev,
      ms,
      beat: 0,
    };
  }
  return runQuery(b.prompt, {
    filter: b.filter,
    k: b.k,
    rewrite: REWRITES[b.id],
    beat: i,
  });
}

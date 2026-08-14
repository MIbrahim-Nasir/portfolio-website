'use client';

import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FilePdf, GithubLogo, LinkedinLogo } from '@phosphor-icons/react';
import { site } from '@/data/site';
import { type Mode } from './types';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export function Header() {
  return (
    <header className="pointer-events-auto relative z-30 flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:absolute md:inset-x-5 md:top-5 md:px-0 md:py-0">
      <p className="text-sm tracking-wide">{site.family}</p>
      <div className="flex items-center gap-3">
        <p className="text-mute hidden font-mono text-[10px] tracking-[0.18em] uppercase sm:block">
          {site.title}
        </p>
        <a
          href={site.resumeUrl}
          aria-label="Resume PDF"
          className="text-mute hover:text-fog"
        >
          <FilePdf size={16} />
        </a>
        <a
          href={site.social.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="text-mute hover:text-fog"
        >
          <GithubLogo size={16} />
        </a>
        <a
          href={site.social.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="text-mute hover:text-fog"
        >
          <LinkedinLogo size={16} />
        </a>
      </div>
    </header>
  );
}

export function Sheet({
  mode,
  workIndex,
  craftHot,
  pathIndex,
  onWork,
  onCraft,
  onPath,
}: {
  mode: Mode;
  workIndex: number;
  craftHot: number;
  pathIndex: number;
  onWork: (i: number) => void;
  onCraft: (i: number) => void;
  onPath: (i: number) => void;
}) {
  const layer = site.layers[craftHot] ?? site.layers[0];
  const job = site.record[pathIndex];
  const work = site.work[workIndex];

  return (
    <AnimatePresence mode="wait">
      {mode === 'home' ? (
        <motion.div
          key="home"
          {...fade}
          transition={{ duration: 0.28 }}
          className="p-4 md:p-5"
        >
          <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
            {site.given} {site.family}
          </h1>
          <p className="text-mute mt-1 text-sm">
            {site.title}, {site.location}
          </p>
          <p className="text-fog/85 mt-3 text-sm leading-relaxed">
            {site.opening.line}
          </p>
          <p className="text-mute mt-3 text-sm leading-relaxed">
            {site.opening.body}
          </p>
          <dl className="mt-5 space-y-3">
            {site.intro.map((row) => (
              <div key={row.k}>
                <dt className="text-gold font-mono text-[10px] tracking-[0.14em] uppercase">
                  {row.k}
                </dt>
                <dd className="text-fog/85 mt-1 text-sm">{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-gold mt-5 font-mono text-[10px] tracking-[0.18em] uppercase">
            Drag the core
          </p>
        </motion.div>
      ) : null}

      {mode === 'work' ? (
        <motion.div
          key="work"
          {...fade}
          transition={{ duration: 0.28 }}
          className="p-4 md:p-5"
        >
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            {work.label}
          </h2>
          <p className="text-mute mt-1 text-sm">
            {work.place}, {work.year}
          </p>
          <p className="text-fog/85 mt-3 text-sm leading-relaxed">
            {work.summary}
          </p>
          <p className="text-gold mt-3 text-sm">{work.outcome}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {work.stack.map((s) => (
              <span
                key={s}
                className="border-line text-mute rounded-lg border px-2 py-1 font-mono text-[10px]"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {site.work.map((w, i) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onWork(i)}
                className={`rounded-lg px-3 py-1 text-xs active:scale-[0.98] ${
                  i === workIndex
                    ? 'bg-fog text-void'
                    : 'border-line text-mute border'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          {'href' in work && work.href ? (
            <a
              href={work.href}
              target="_blank"
              rel="noreferrer"
              className="text-gold mt-4 inline-block text-sm"
            >
              GitHub
            </a>
          ) : null}
        </motion.div>
      ) : null}

      {mode === 'craft' ? (
        <motion.div
          key="craft"
          {...fade}
          transition={{ duration: 0.28 }}
          className="p-4 md:p-5"
        >
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            {layer.name}
          </h2>
          <p className="text-mute mt-2 text-sm leading-relaxed">{layer.body}</p>
          <ul className="mt-4 space-y-3">
            {layer.items.map((item) => (
              <li key={item.name}>
                <p className="text-gold font-mono text-[10px] tracking-[0.14em] uppercase">
                  {item.name}
                </p>
                <p className="text-fog/85 mt-1 text-sm leading-relaxed">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {site.layers.map((item, i) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onCraft(i)}
                className={`rounded-lg px-3 py-1 text-xs active:scale-[0.98] ${
                  i === craftHot
                    ? 'bg-fog text-void'
                    : 'border-line text-mute border'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}

      {mode === 'path' ? (
        <motion.div
          key="path"
          {...fade}
          transition={{ duration: 0.28 }}
          className="p-4 md:p-5"
        >
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            {job.role}
          </h2>
          <p className="text-mute mt-1 text-sm">
            {job.org}, {job.place}
          </p>
          <p className="text-gold mt-1 font-mono text-[10px]">{job.dates}</p>
          <p className="text-fog/85 mt-3 text-sm leading-relaxed">
            {job.focus}
          </p>
          <ul className="mt-4 space-y-2">
            {job.points.map((p) => (
              <li key={p} className="text-fog/85 text-sm leading-relaxed">
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.stack.map((s) => (
              <span
                key={s}
                className="border-line text-mute rounded-lg border px-2 py-1 font-mono text-[10px]"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {site.record.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onPath(i)}
                className={`rounded-lg px-3 py-1 text-xs active:scale-[0.98] ${
                  i === pathIndex
                    ? 'bg-fog text-void'
                    : 'border-line text-mute border'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}

      {mode === 'ping' ? <WriteForm /> : null}
    </AnimatePresence>
  );
}

function WriteForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>(
    'idle'
  );
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') || ''),
          email: String(form.get('email') || ''),
          subject: 'Portfolio',
          message: String(form.get('message') || ''),
        }),
      });
      if (!res.ok) throw new Error('Could not send');
      setStatus('ok');
      e.currentTarget.reset();
    } catch (err) {
      setStatus('err');
      setError(err instanceof Error ? err.message : 'Could not send');
    }
  }

  return (
    <motion.form
      key="ping"
      {...fade}
      transition={{ duration: 0.28 }}
      onSubmit={onSubmit}
      className="space-y-3 p-4 md:p-5"
    >
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Write if the work fits
      </h2>
      <label className="block text-sm">
        Name
        <input
          required
          name="name"
          className="border-line bg-void focus:border-gold mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          name="email"
          className="border-line bg-void focus:border-gold mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
        />
      </label>
      <label className="block text-sm">
        Message
        <textarea
          required
          name="message"
          rows={3}
          className="border-line bg-void focus:border-gold mt-1 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-fog text-void rounded-xl px-4 py-2 text-sm active:scale-[0.98] disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending' : 'Send'}
      </button>
      {status === 'ok' ? <p className="text-mute text-xs">Received.</p> : null}
      {status === 'err' ? <p className="text-gold text-xs">{error}</p> : null}
      <p className="text-mute font-mono text-[10px]">{site.email}</p>
    </motion.form>
  );
}

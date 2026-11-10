'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { profile, toolkit } from '@/data/profile';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  BUDDY,
  CURSOR_MAX,
  MODE_INDEX,
  MODES,
  TIME_DEFAULT,
  TIME_DIV,
  VOLTS_DEFAULT,
  VOLTS_DIV,
  XY_FX,
  XY_FY,
  bandOf,
  fftBin,
  lockDistance,
  type ModeId,
} from './channels';
import Crt, { SOFT_SLOTS, type CrtState } from './Crt';
import Knob from './Knob';
import { Group, Led, PushButton, Toggle } from './Controls';
import Probe from './Probe';
import Buddy, { say } from './Buddy';
import { tick } from './sound';
import styles from './scope.module.css';

const INTENSITY_DEFAULT = 60;

export default function ScopeApp({ fontClassName }: { fontClassName: string }) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<ModeId>('id');
  const [keyIdx, setKeyIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(TIME_DEFAULT);
  const [voltsIdx, setVoltsIdx] = useState(VOLTS_DEFAULT);
  const [cursor, setCursor] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [intensity, setIntensity] = useState(INTENSITY_DEFAULT);
  const [persist, setPersist] = useState(true);
  const [grid, setGrid] = useState(false);
  const [click, setClick] = useState(false);
  const [run, setRun] = useState(true);
  const [power, setPower] = useState(true);
  const [retrig, setRetrig] = useState(0);
  const [xy, setXy] = useState(false);
  const [recall, setRecall] = useState<number | null>(null);

  const clickRef = useRef(click);
  useEffect(() => {
    clickRef.current = click;
  }, [click]);

  const feel = useCallback(
    (kind: 'detent' | 'button' | 'switch' = 'detent') => {
      if (!clickRef.current) return;
      tick(kind);
      if (
        kind !== 'detent' &&
        typeof navigator !== 'undefined' &&
        'vibrate' in navigator
      )
        navigator.vibrate?.(6);
    },
    []
  );

  const selectMode = useCallback(
    (m: ModeId) => {
      setXy(false);
      setRecall(null);
      if (m === mode) return;
      feel('button');
      setMode(m);
      setKeyIdx(0);
      setCursorVisible(false);
      say(MODES[MODE_INDEX[m]].buddy);
    },
    [feel, mode]
  );

  const step = useCallback(
    (dir: number) => {
      const i = (MODE_INDEX[mode] + dir + MODES.length) % MODES.length;
      selectMode(MODES[i].id);
    },
    [mode, selectMode]
  );

  const toggleXy = useCallback(() => {
    if (!xy) say(BUDDY.xy);
    setXy(!xy);
    setRecall(null);
    feel('button');
  }, [feel, xy]);

  // keys: 1–7 channels, X for X-Y, Esc closes the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      )
        return;
      if (e.key === 'Escape') {
        setRecall(null);
        return;
      }
      if (e.key === 'x' || e.key === 'X') {
        toggleXy();
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= MODES.length)
        selectMode(MODES[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectMode, toggleXy]);

  const def = MODES[MODE_INDEX[mode]];
  const bin = fftBin(cursor);
  const activeKey = mode === 'fft' ? Math.max(0, bandOf(bin)) : keyIdx;
  const key = def.keys[activeKey];

  // the egg: X-Y lock
  const lockDist = lockDistance(timeIdx, voltsIdx);
  const xyBars = Math.max(0, Math.min(5, 5 - lockDist));
  const warned = useRef({ warm: false, egg: false });
  useEffect(() => {
    if (!xy) return;
    if (lockDist === 0 && !warned.current.egg) {
      warned.current.egg = true;
      say(BUDDY.egg);
    } else if (lockDist > 0 && lockDist <= 2 && !warned.current.warm) {
      warned.current.warm = true;
      say(BUDDY.warm);
    }
  }, [xy, lockDist]);

  const crtState: CrtState = useMemo(
    () => ({
      mode,
      timeIdx,
      voltsIdx,
      cursor,
      cursorVisible,
      bin,
      intensity,
      persist,
      grid,
      run,
      power,
      retrig,
      key: activeKey,
      cx: key?.cx,
      cy: key?.cy,
      solo: key?.solo,
      xy,
      fx: XY_FX[timeIdx],
      fy: XY_FY[voltsIdx],
      lockDist,
      menu: recall !== null,
    }),
    [
      mode,
      timeIdx,
      voltsIdx,
      cursor,
      cursorVisible,
      bin,
      intensity,
      persist,
      grid,
      run,
      power,
      retrig,
      activeKey,
      key,
      xy,
      lockDist,
      recall,
    ]
  );

  const onSoftKey = (i: number) => {
    const k = def.keys[i];
    if (!k) return;
    feel('button');
    setXy(false);
    if (k.recall !== undefined) {
      setRecall(0);
      return;
    }
    setRecall(null);
    setKeyIdx(i);
    if (k.bin !== undefined)
      setCursor(Math.round((k.bin / (toolkit.length - 1)) * CURSOR_MAX));
  };

  const autoset = () => {
    setTimeIdx(TIME_DEFAULT);
    setVoltsIdx(VOLTS_DEFAULT);
    setIntensity(INTENSITY_DEFAULT);
    setCursor(0);
    setCursorVisible(false);
    setRun(true);
    setXy(false);
    setRecall(null);
    setRetrig((r) => r + 1);
    feel('button');
  };

  const status = `${TIME_DIV[timeIdx]} · ${VOLTS_DIV[voltsIdx]} · ${run ? 'RUN' : 'STOP'}`;

  return (
    <div ref={rootRef} className={`${styles.root} ${fontClassName}`}>
      <a href="#screen" className={styles.skip}>
        Skip to the screen
      </a>
      <p className={styles.srOnly} aria-live="polite">
        {power ? `${def.key}: ${def.title}` : 'Power off'}
      </p>

      <main className={styles.bench}>
        <div className={styles.instrument}>
          <span
            className={`${styles.screw} ${styles.screwTL}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.screw} ${styles.screwTR}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.screw} ${styles.screwBL}`}
            aria-hidden="true"
          />
          <span
            className={`${styles.screw} ${styles.screwBR}`}
            aria-hidden="true"
          />

          <header className={styles.topPlate}>
            <div className={styles.brand}>
              <span className={styles.badge} aria-hidden="true">
                SB-465
              </span>
              <div className={styles.brandText}>
                <h1 className={styles.brandName}>{profile.name}</h1>
                <p className={styles.brandRole}>
                  <b>{profile.role}</b> · {profile.location}
                </p>
              </div>
            </div>
            <nav className={styles.plateNav} aria-label="Site">
              <Link href="/concepts">All cuts</Link>
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Résumé
              </a>
            </nav>
            <div className={styles.powerBlock}>
              <PushButton
                pressed={power}
                onClick={() => {
                  if (power) say(BUDDY.off);
                  setPower(!power);
                  feel('switch');
                }}
                led={power}
                ledColor="red"
                variant="dark"
                ariaLabel="Power"
              >
                POWER
              </PushButton>
            </div>
          </header>

          <div className={styles.face}>
            <div className={styles.screenCol} id="screen">
              <div className={styles.bezel}>
                <div className={styles.bezelRow}>
                  <Crt
                    def={def}
                    state={crtState}
                    reduced={reduced}
                    status={status}
                    activeKey={activeKey}
                    onKey={onSoftKey}
                    recall={recall}
                    onRecall={(i) => {
                      feel('button');
                      setRecall(i);
                    }}
                    xyBars={xyBars}
                    onSwipe={step}
                  />
                  <div className={styles.bezelKeys} aria-hidden="true">
                    <span className={styles.bezelHead} />
                    {Array.from({ length: SOFT_SLOTS }, (_, i) => (
                      <span key={i} className={styles.bezelSlot}>
                        {def.keys[i] ? (
                          <button
                            type="button"
                            tabIndex={-1}
                            className={styles.bezelCap}
                            data-on={(i === activeKey && !xy) || undefined}
                            onClick={() => onSoftKey(i)}
                          />
                        ) : (
                          <span className={styles.bezelCapIdle} />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.bezelLip}>
                  <span>DIGITAL PHOSPHOR · 4 CH + MATH</span>
                  <span className={styles.lipHint} aria-hidden="true">
                    ◂ SWIPE ▸
                  </span>
                  <span
                    className={styles.buddyHome}
                    data-buddy-home
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <Group title="Channel · chapter" className={styles.chanGroup}>
              <div className={styles.chanRow} role="group" aria-label="Channel">
                {MODES.map((m, i) => (
                  <PushButton
                    key={m.id}
                    pressed={mode === m.id && !xy}
                    onClick={() => selectMode(m.id)}
                    led={mode === m.id && power}
                    variant={i < 4 ? 'dark' : 'grey'}
                    sub={m.short}
                    ariaLabel={`${m.key}: ${m.title}`}
                  >
                    {m.key}
                  </PushButton>
                ))}
              </div>
            </Group>

            <div className={styles.controls}>
              <div className={styles.ctlRow}>
                <Group title="Vertical · Y">
                  <div className={styles.groupInner}>
                    <Knob
                      label="Volts/div"
                      value={voltsIdx}
                      min={0}
                      max={VOLTS_DIV.length - 1}
                      onChange={setVoltsIdx}
                      onDetent={() => feel('detent')}
                      legends={VOLTS_DIV}
                      size={72}
                      pxPerStep={16}
                      valueText={(v) => `${VOLTS_DIV[v]} per division`}
                    />
                  </div>
                </Group>
                <Group title="Horizontal · X">
                  <div className={styles.groupInner}>
                    <Knob
                      label="Time/div"
                      value={timeIdx}
                      min={0}
                      max={TIME_DIV.length - 1}
                      onChange={setTimeIdx}
                      onDetent={() => feel('detent')}
                      legends={TIME_DIV}
                      size={72}
                      pxPerStep={14}
                      valueText={(v) => `${TIME_DIV[v]} per division`}
                    />
                  </div>
                </Group>
              </div>

              <div className={styles.ctlRow}>
                <Group title="Display">
                  <div className={styles.groupInner}>
                    <PushButton
                      pressed={xy}
                      onClick={toggleXy}
                      led={xy && power}
                      ledColor={xy && lockDist === 0 ? 'red' : 'amber'}
                      variant="grey"
                      sub="FIND THE LOCK"
                      ariaLabel="X-Y mode"
                    >
                      X-Y
                    </PushButton>
                    <PushButton
                      pressed={recall !== null}
                      onClick={() => {
                        feel('button');
                        setXy(false);
                        setRecall((r) => (r === null ? 0 : null));
                      }}
                      led={recall !== null && power}
                      variant="grey"
                      sub="6 BUILDS"
                      ariaLabel="Save and recall: six saved builds"
                    >
                      SAVE/RCL
                    </PushButton>
                    <Knob
                      label="Cursor"
                      value={cursor}
                      min={0}
                      max={CURSOR_MAX}
                      onChange={(v) => {
                        if (mode === 'fft' && fftBin(v) !== fftBin(cursor))
                          feel('detent');
                        setCursor(v);
                        setCursorVisible(true);
                      }}
                      size={48}
                      ticks={11}
                      sweep={300}
                      cap="putty"
                      pxPerStep={2.2}
                      valueText={(v) =>
                        mode === 'fft'
                          ? `Marker on ${toolkit[fftBin(v)]}`
                          : `Cursor at ${(v / 10).toFixed(1)} divisions`
                      }
                    />
                    <Knob
                      className={styles.hideNarrow}
                      label="Intens"
                      value={intensity}
                      min={0}
                      max={100}
                      onChange={setIntensity}
                      size={48}
                      ticks={11}
                      sweep={300}
                      cap="putty"
                      pxPerStep={2.2}
                      valueText={(v) => `Intensity ${v}%`}
                    />
                  </div>
                </Group>
              </div>

              <div className={styles.ctlRow}>
                <Group title="Acquire">
                  <div className={styles.groupInner}>
                    <Toggle
                      label="Persist"
                      on={persist}
                      onChange={(v) => {
                        setPersist(v);
                        feel('switch');
                      }}
                    />
                    <Toggle
                      label="Grid"
                      on={grid}
                      onChange={(v) => {
                        setGrid(v);
                        feel('switch');
                      }}
                      offText="DARK"
                      onText="LIT"
                    />
                    <Toggle
                      label="Click"
                      on={click}
                      onChange={(v) => {
                        setClick(v);
                        clickRef.current = v;
                        feel('switch');
                      }}
                    />
                  </div>
                </Group>
                <Group title="Trigger">
                  <div className={styles.groupInner}>
                    <PushButton
                      pressed={!run}
                      onClick={() => {
                        setRun((r) => !r);
                        feel('button');
                      }}
                      led={power}
                      ledColor={run ? 'amber' : 'red'}
                      variant="grey"
                      sub={run ? 'RUN' : 'STOP'}
                      ariaLabel={run ? 'Stop the trace' : 'Run the trace'}
                    >
                      RUN/STOP
                    </PushButton>
                    <PushButton
                      onClick={autoset}
                      variant="orange"
                      sub="RESET"
                      ariaLabel="Autoset: reset the knobs"
                    >
                      AUTO
                    </PushButton>
                    <Led on={power && run} color="amber" label="TRIG'D" />
                  </div>
                </Group>
              </div>

              <p className={styles.legendKeys} aria-hidden="true">
                KEYS 1–{MODES.length} · CHANNEL &nbsp;·&nbsp; X · X-Y
                &nbsp;·&nbsp; SOFTKEYS · MEASURE
              </p>
            </div>
          </div>

          <Probe />
        </div>

        <footer className={styles.footer}>
          <span>SB-465 Signal Bench · {profile.name}</span>
          <span className={styles.footerLinks}>
            <Link href="/concepts">All cuts</Link>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Résumé
            </a>
            <Link href="/">Main site →</Link>
          </span>
        </footer>
      </main>

      <Buddy rootRef={rootRef} reduced={reduced} />
    </div>
  );
}

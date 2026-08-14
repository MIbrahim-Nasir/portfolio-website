'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Header, Sheet } from './Chrome';
import Rail from './Rail';
import { modeList, type Mode } from './types';
import { site } from '@/data/site';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const World = dynamic(() => import('./World'), { ssr: false });

export default function StudioApp() {
  const desktop = useIsDesktop(768);
  const [mode, setMode] = useState<Mode>('home');
  const [workIndex, setWorkIndex] = useState(0);
  const [craftHot, setCraftHot] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-room', mode);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)
        return;
      const hit = modeList.find(
        (id) => e.key === String(modeList.indexOf(id) + 1)
      );
      if (hit) setMode(hit);
      if (mode === 'work') {
        if (e.key === 'ArrowRight')
          setWorkIndex((i) => (i + 1) % site.work.length);
        if (e.key === 'ArrowLeft') {
          setWorkIndex((i) => (i - 1 + site.work.length) % site.work.length);
        }
      }
      if (mode === 'path') {
        if (e.key === 'ArrowRight')
          setPathIndex((i) => (i + 1) % site.record.length);
        if (e.key === 'ArrowLeft') {
          setPathIndex(
            (i) => (i - 1 + site.record.length) % site.record.length
          );
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  return (
    <div
      data-room={mode}
      className="bg-void text-fog flex h-dvh w-full flex-col overflow-hidden md:block"
    >
      <div className="studio-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.07]" />
      <Header />
      <div className="relative min-h-0 flex-1 md:absolute md:inset-0">
        <World
          mode={mode}
          compact={!desktop}
          workIndex={workIndex}
          craftHot={craftHot}
          pathIndex={pathIndex}
          onWork={setWorkIndex}
          onCraft={setCraftHot}
          onPath={setPathIndex}
        />
        <span className="mark pointer-events-none absolute top-4 left-[176px] hidden border-t border-l md:block" />
        <span className="mark pointer-events-none absolute top-4 right-4 hidden border-t border-r md:block" />
      </div>
      <div className="border-line bg-panel md:bg-panel/90 relative z-20 max-h-[38vh] shrink-0 overflow-y-auto border-t md:absolute md:inset-y-20 md:right-6 md:max-h-[calc(100dvh-6.5rem)] md:w-[340px] md:rounded-2xl md:border md:backdrop-blur-md">
        <Sheet
          mode={mode}
          workIndex={workIndex}
          craftHot={craftHot}
          pathIndex={pathIndex}
          onWork={setWorkIndex}
          onCraft={setCraftHot}
          onPath={setPathIndex}
        />
      </div>
      <Rail mode={mode} onMode={setMode} />
    </div>
  );
}

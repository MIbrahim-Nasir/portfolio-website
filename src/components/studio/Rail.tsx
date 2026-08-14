'use client';

import {
  Atom,
  Circuitry,
  Cube,
  PaperPlaneTilt,
  Path,
} from '@phosphor-icons/react';
import { modeList, rooms, type Mode } from './types';

const icons = {
  home: Atom,
  work: Cube,
  craft: Circuitry,
  path: Path,
  ping: PaperPlaneTilt,
};

export default function Rail({
  mode,
  onMode,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
}) {
  return (
    <nav
      aria-label="Rooms"
      className="border-line bg-panel md:bg-panel/90 pointer-events-auto relative z-30 flex shrink-0 items-stretch justify-center gap-1 border-t px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:absolute md:top-1/2 md:bottom-auto md:left-5 md:w-[148px] md:-translate-y-1/2 md:flex-col md:items-stretch md:rounded-2xl md:border md:p-1.5 md:pb-1.5 md:backdrop-blur-md"
    >
      {modeList.map((id) => {
        const room = rooms[id];
        const Icon = icons[id];
        const on = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onMode(id)}
            aria-current={on ? 'page' : undefined}
            aria-label={room.label}
            className={`flex min-h-11 min-w-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm transition active:scale-[0.98] md:flex-none md:justify-start md:px-3 ${
              on ? 'bg-fog text-void' : 'text-mute hover:text-fog'
            }`}
          >
            <Icon size={18} weight={on ? 'fill' : 'regular'} />
            <span className="hidden md:inline">{room.label}</span>
            <span className="ml-auto hidden font-mono text-[10px] opacity-60 md:inline">
              {room.key}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

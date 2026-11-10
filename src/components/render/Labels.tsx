'use client';

import { LABELS } from './labelAnchors';
import { film } from './store';

// Labels for the agent graph and the globe. The scene projects their 3D
// anchors every frame and writes transform + opacity straight to these nodes.
export default function Labels() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[15]" aria-hidden>
      {LABELS.map((l, i) => (
        <div
          key={l.label}
          ref={(el) => {
            film.labels[i] = el;
          }}
          className={`node-label absolute top-0 left-0 ${l.kind === 'city' ? 'city' : ''}`}
          style={{ opacity: 0 }}
        >
          <span>{l.label}</span>
          <em>{l.sub}</em>
        </div>
      ))}
    </div>
  );
}

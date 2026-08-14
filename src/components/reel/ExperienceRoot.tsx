'use client';

import { useEffect, useState } from 'react';
import TitleSequence from './TitleSequence';
import SmoothScroll from './SmoothScroll';
import Cursor from './Cursor';
import FrameMarks from './FrameMarks';
import Opening from './Opening';
import Cuts from './Cuts';
import WorkReel from './WorkReel';
import Workshop from './Workshop';
import Record from './Record';
import Transmission from './Transmission';

export default function ExperienceRoot() {
  const [booted, setBooted] = useState(false);
  const [title, setTitle] = useState(true);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const skip =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      Boolean(sessionStorage.getItem('reel-seen'));
    setTitle(!skip);
    setLive(skip);
    setBooted(true);
  }, []);

  if (!booted) {
    return <div className="bg-ink min-h-[100dvh]" />;
  }

  return (
    <div className="bg-ink text-ivory">
      {title && !live ? (
        <TitleSequence
          onDone={() => {
            setLive(true);
            setTitle(false);
          }}
        />
      ) : null}
      {live ? (
        <>
          <SmoothScroll />
          <Cursor />
          <FrameMarks />
          <main>
            <Opening />
            <Cuts />
            <WorkReel />
            <Workshop />
            <Record />
            <Transmission />
          </main>
        </>
      ) : null}
    </div>
  );
}

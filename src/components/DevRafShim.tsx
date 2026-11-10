'use client';

// Dev-only: with ?rafshim, drive requestAnimationFrame from a MessageChannel so
// pages keep animating in a hidden/background browser tab (headless checks).
if (
  process.env.NODE_ENV !== 'production' &&
  typeof window !== 'undefined' &&
  location.search.includes('rafshim')
) {
  // MessageChannel callbacks are not throttled in background tabs, unlike timers
  const queue = new Map<number, FrameRequestCallback>();
  const ch = new MessageChannel();
  let id = 0,
    last = 0,
    pumping = false;
  ch.port1.onmessage = () => {
    const now = performance.now();
    if (now - last < 16) return void ch.port2.postMessage(0);
    last = now;
    const cbs = [...queue.values()];
    queue.clear();
    pumping = false;
    cbs.forEach((cb) => cb(now));
  };
  window.requestAnimationFrame = (cb) => {
    queue.set(++id, cb);
    if (!pumping) {
      pumping = true;
      ch.port2.postMessage(0);
    }
    return id;
  };
  window.cancelAnimationFrame = (i) => void queue.delete(i);
}

export default function DevRafShim() {
  return null;
}

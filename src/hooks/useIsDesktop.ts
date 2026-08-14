'use client';

import { useEffect, useState } from 'react';

export function useIsDesktop(min = 1024) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${min}px)`);
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [min]);

  return desktop;
}

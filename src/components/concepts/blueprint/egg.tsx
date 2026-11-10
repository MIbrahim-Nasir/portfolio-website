'use client';

import { createContext, useContext } from 'react';

/* The checker's game: every sheet's title block has an empty CHK box.
   Initial all seven and sheet 00 (the checker's print) is issued. */

export type Egg = {
  checked: ReadonlySet<number>;
  check: (n: number) => void;
  unlocked: boolean;
  say: (line: string) => void;
};

export const EggCtx = createContext<Egg>({
  checked: new Set(),
  check: () => {},
  unlocked: false,
  say: () => {},
});
export const useEgg = () => useContext(EggCtx);

export const STORE_KEY = 'bp-checked-v1';

export const SHEETS = [
  {
    n: 1,
    id: 'sheet-01',
    short: 'Title sheet',
    view: 'Title block · notes · index',
  },
  {
    n: 2,
    id: 'sheet-02',
    short: 'The engineer',
    view: 'Exploded assembly · BOM',
  },
  {
    n: 3,
    id: 'sheet-03',
    short: 'SAIF AI Designer',
    view: 'System diagram · records',
  },
  {
    n: 4,
    id: 'sheet-04',
    short: 'Vision arm',
    view: 'Exploded iso · control loop',
  },
  {
    n: 5,
    id: 'sheet-05',
    short: 'Core XY gantry',
    view: 'Plan view · bench schedule',
  },
  {
    n: 6,
    id: 'sheet-06',
    short: 'DeltaX backends',
    view: 'Key plan · section A–A',
  },
  {
    n: 7,
    id: 'sheet-07',
    short: 'Route · issue',
    view: 'Site plan · title block',
  },
] as const;

export const TOTAL = SHEETS.length;
export const nn = (n: number) => String(n).padStart(2, '0');

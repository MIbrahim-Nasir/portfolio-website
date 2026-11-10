// Each domain is numbered, and its colour is that number in the resistor colour code
// (0 black, 1 brown, 2 red, 3 orange, 4 yellow, 5 green, 6 blue, 7 violet, 8 grey).
// The signal takes the colour of the domain it is in, and changes at every interface.

export type DomainId =
  | 'identity'
  | 'optics'
  | 'ai'
  | 'software'
  | 'firmware'
  | 'electronics'
  | 'mechanics'
  | 'people'
  | 'contact';

export type Domain = {
  id: DomainId;
  n: string;
  name: string;
  band: string; // resistor colour name
  color: string;
  convention: string; // the drawing convention this domain is drawn in
};

export const DOMAINS: Domain[] = [
  {
    id: 'identity',
    n: '00',
    name: 'Identity',
    band: 'black',
    color: '#ece8de',
    convention: 'block diagram',
  },
  {
    id: 'optics',
    n: '01',
    name: 'Optics',
    band: 'brown',
    color: '#c98a5b',
    convention: 'ray diagram, thin-lens notation',
  },
  {
    id: 'ai',
    n: '02',
    name: 'AI',
    band: 'red',
    color: '#ff5340',
    convention: 'computation graph',
  },
  {
    id: 'software',
    n: '03',
    name: 'Software',
    band: 'orange',
    color: '#ff9426',
    convention: 'sequence diagram, source',
  },
  {
    id: 'firmware',
    n: '04',
    name: 'Firmware',
    band: 'yellow',
    color: '#f0d03a',
    convention: 'UART timing, state machine',
  },
  {
    id: 'electronics',
    n: '05',
    name: 'Electronics',
    band: 'green',
    color: '#3ccf7d',
    convention: 'schematic, timing diagram',
  },
  {
    id: 'mechanics',
    n: '06',
    name: 'Mechanics',
    band: 'blue',
    color: '#4da3ff',
    convention: 'ISO 128 lines, section hatching',
  },
  {
    id: 'people',
    n: '07',
    name: 'People',
    band: 'violet',
    color: '#ad8cff',
    convention: 'schedule, fan-out',
  },
  {
    id: 'contact',
    n: '08',
    name: 'Contact',
    band: 'grey',
    color: '#a9a9a2',
    convention: 'summing junction',
  },
];

export const D = Object.fromEntries(DOMAINS.map((d) => [d.id, d])) as Record<
  DomainId,
  Domain
>;

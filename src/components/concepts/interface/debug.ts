// What the signal actually is in each domain, as raw bytes. Shown by the debug easter egg.
import type { DomainId } from './domains';
import { HOME_ANGLES } from './figs/MechArm';

const enc = (s: string) => Array.from(new TextEncoder().encode(s));

function f32(values: number[]) {
  const dv = new DataView(new ArrayBuffer(values.length * 4));
  values.forEach((v, i) => dv.setFloat32(i * 4, v, true));
  return Array.from(new Uint8Array(dv.buffer));
}

export type Payload = {
  src: string;
  bytes: number[];
  note: string;
  bits?: boolean;
};

export const PAYLOAD: Record<DomainId, Payload> = {
  identity: {
    src: 'whoami',
    bytes: enc('Mohammed Ibrahim Nasir\nAI Engineer, Dubai\n'),
    note: 'utf-8',
  },
  optics: {
    src: 'frame_t.jpg, first 25 bytes',
    bytes: [
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00,
    ],
    note: 'FFD8 start of image · APP0 "JFIF" · FFDB quantisation table',
  },
  ai: {
    src: 'resp.text',
    bytes: enc('{"action": "grab"}'),
    note: 'one field, three allowed values',
  },
  software: {
    src: 'ser.write()',
    bytes: enc('GRAB\n'),
    note: '5 bytes to /dev/ttyUSB0',
  },
  firmware: {
    src: 'TX pin · 9600 8N1 · LSB first',
    bytes: enc('GRAB\n'),
    note: 'start 0 · 8 data · stop 1 · 104.2 µs per bit',
    bits: true,
  },
  electronics: {
    src: 'PORTD, sampled every 0.5 ms',
    bytes: [0x24, 0x20, 0x24, 0x20, 0x24, 0x20, 0x24, 0x20],
    note: 'bit 5 DIR = 1 · bit 2 STEP toggling at 1 kHz',
  },
  mechanics: {
    src: 'θ₂ θ₃ θ₄ at home, float32 LE',
    bytes: f32(HOME_ANGLES),
    note: HOME_ANGLES.map((a) => `${a.toFixed(2)}°`).join(' · '),
  },
  people: {
    src: 'tsig.cfg',
    bytes: enc('members=30\nprojects=10+\nhours=16:00-22:00\n'),
    note: 'utf-8',
  },
  contact: {
    src: 'setpoint',
    bytes: enc(`mailto:mibrahimnasir.engineer@gmail.com`),
    note: 'r(t), whenever you like',
  },
};

const hex = (b: number) => b.toString(16).padStart(2, '0');
const asc = (b: number) =>
  b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.';

/** xxd-style dump, 8 bytes a row so it fits a phone */
export function dump(p: Payload): string[] {
  if (p.bits) {
    return p.bytes.map((b, i) => {
      const lsb = Array.from({ length: 8 }, (_, k) => (b >> k) & 1).join('');
      return `${String(i).padStart(2, '0')}  ${hex(b)}  0 ${lsb} 1   ${asc(b) === '.' ? '\\n' : `'${asc(b)}'`}`;
    });
  }
  const out: string[] = [];
  for (let i = 0; i < p.bytes.length; i += 8) {
    const row = p.bytes.slice(i, i + 8);
    out.push(
      `${i.toString(16).padStart(4, '0')}  ${row.map(hex).join(' ').padEnd(23, ' ')}  ${row.map(asc).join('')}`
    );
  }
  return out;
}

'use client';

import { profile } from '@/data/profile';
import styles from './scope.module.css';

// The front-panel input jacks are the contact block.
const JACKS = [
  {
    key: 'CH1',
    name: 'EMAIL',
    value: profile.email,
    href: `mailto:${profile.email}`,
    external: false,
  },
  {
    key: 'CH2',
    name: 'PHONE',
    value: profile.phone,
    href: `tel:${profile.phone.replace(/\s+/g, '')}`,
    external: false,
  },
  {
    key: 'CH3',
    name: 'LINKEDIN',
    value: 'in/mohammed-ibrahim-nasir',
    href: profile.linkedin,
    external: true,
  },
  {
    key: 'CH4',
    name: 'GITHUB',
    value: 'MIbrahim-Nasir',
    href: profile.github,
    external: true,
  },
  {
    key: 'EXT',
    name: 'RÉSUMÉ',
    value: 'resume.pdf',
    href: profile.resumeUrl,
    external: true,
  },
];

export default function Probe() {
  return (
    <section
      id="inputs"
      className={styles.inputs}
      aria-labelledby="inputs-title"
      data-contact
    >
      <div className={styles.inputsHead}>
        <p className={styles.legendSmall}>
          PROBE INPUTS · 1 MΩ ∥ 16 pF · 300 V CAT II
        </p>
        <h2 id="inputs-title" className={styles.inputsTitle}>
          Get in touch.
        </h2>
        <p className={styles.inputsLede}>
          Open to AI engineering roles, remote or UAE.
        </p>
        <svg className={styles.cal} viewBox="0 0 240 64" aria-hidden="true">
          <path
            className={styles.calIdle}
            d="M4 48 H34 V16 C36 8 40 10 46 16 H64 V48 C66 56 70 54 76 48 H94 V16 C96 8 100 10 106 16 H124 V48 C126 56 130 54 136 48 H154 V16 C156 8 160 10 166 16 H184 V48 C186 56 190 54 196 48 H214 V16 C216 8 220 10 226 16 H236"
          />
          <path
            className={styles.calSet}
            d="M4 48 H34 V16 H64 V48 H94 V16 H124 V48 H154 V16 H184 V48 H214 V16 H236"
          />
          <text x="4" y="62">
            CAL 1 kHz · CLIP ON TO COMPENSATE
          </text>
        </svg>
      </div>
      <ul className={styles.jacks}>
        {JACKS.map((j) => (
          <li key={j.name}>
            <a
              className={styles.jack}
              href={j.href}
              {...(j.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              <span className={styles.jackLed} aria-hidden="true" />
              <span className={styles.bnc} aria-hidden="true">
                <span className={styles.bncPin} />
                <span className={styles.bncLug} />
                <span className={`${styles.bncLug} ${styles.bncLug2}`} />
              </span>
              <span className={styles.jackKey}>
                <span aria-hidden="true">{j.key} · </span>
                {j.name}
              </span>
              <span className={styles.jackValue}>{j.value}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

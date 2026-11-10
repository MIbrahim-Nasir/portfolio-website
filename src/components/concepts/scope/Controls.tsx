'use client';

import type { ReactNode } from 'react';
import styles from './scope.module.css';

export function Led({
  on,
  color = 'amber',
  label,
}: {
  on: boolean;
  color?: 'amber' | 'red' | 'green';
  label?: string;
}) {
  return (
    <span className={styles.ledWrap}>
      <span
        className={styles.led}
        data-color={color}
        data-on={on || undefined}
        aria-hidden="true"
      />
      {label ? <span className={styles.ledLabel}>{label}</span> : null}
    </span>
  );
}

export function PushButton({
  children,
  pressed,
  onClick,
  led,
  ledColor = 'amber',
  sub,
  ariaLabel,
  variant = 'grey',
  wide,
}: {
  children: ReactNode;
  pressed?: boolean;
  onClick: () => void;
  led?: boolean;
  ledColor?: 'amber' | 'red' | 'green';
  sub?: string;
  ariaLabel?: string;
  variant?: 'grey' | 'dark' | 'orange';
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.push}
      data-variant={variant}
      data-wide={wide || undefined}
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {led !== undefined ? (
        <span
          className={styles.led}
          data-color={ledColor}
          data-on={led || undefined}
          aria-hidden="true"
        />
      ) : (
        <span className={styles.ledSpacer} aria-hidden="true" />
      )}
      <span className={styles.pushCap}>
        <span className={styles.pushLegend}>{children}</span>
      </span>
      {sub ? <span className={styles.pushSub}>{sub}</span> : null}
    </button>
  );
}

export function Toggle({
  label,
  on,
  onChange,
  onText = 'ON',
  offText = 'OFF',
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  onText?: string;
  offText?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={styles.toggle}
      data-on={on || undefined}
      onClick={() => onChange(!on)}
    >
      <span className={styles.toggleText} aria-hidden="true">
        {onText}
      </span>
      <span className={styles.toggleBody} aria-hidden="true">
        <span className={styles.toggleNut} />
        <span className={styles.toggleLever} />
      </span>
      <span className={styles.toggleText} aria-hidden="true">
        {offText}
      </span>
      <span className={styles.toggleName} aria-hidden="true">
        {label}
      </span>
    </button>
  );
}

export function Group({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={`${styles.group} ${className ?? ''}`}>
      <legend className={styles.groupTitle}>{title}</legend>
      {children}
    </fieldset>
  );
}

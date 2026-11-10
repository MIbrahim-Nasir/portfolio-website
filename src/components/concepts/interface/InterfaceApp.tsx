'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { profile } from '@/data/profile';
import { D, DOMAINS, type DomainId } from './domains';
import {
  DESK,
  gsap,
  REDUCE,
  ScrollTrigger,
  useIsoLayoutEffect,
} from './motion';
import Hero from './Hero';
import Bit from './Bit';
import { Band, DomainSection, Group, Swatch, vars } from './ui';
import {
  GlyphADC,
  GlyphJSON,
  GlyphLoop,
  GlyphMotor,
  GlyphPin,
  GlyphSum,
  GlyphUART,
} from './Glyphs';
import OpticsFig from './figs/Optics';
import AiArmFig from './figs/AiArm';
import AiSaifFig from './figs/AiSaif';
import SenseiFig from './figs/Sensei';
import SoftwareFig from './figs/Software';
import PlumbingFig from './figs/Plumbing';
import FirmwareFig from './figs/Firmware';
import ElectronicsFig from './figs/Electronics';
import EmgFig from './figs/Emg';
import MechArmFig from './figs/MechArm';
import CoreXYFig from './figs/CoreXY';
import PeopleFig from './figs/People';
import PlacesFig from './figs/Places';
import ContactFig from './figs/Contact';
import s from './interface.module.css';

const CHAIN = DOMAINS.filter((d) => d.id !== 'identity');

function Bar({ active }: { active: DomainId }) {
  const cur = D[active];
  return (
    <header className={s.bar}>
      <a
        href="#top"
        className={s.brand}
        aria-label="Mohammed Ibrahim Nasir, back to top"
      >
        <span className={s.brandRes} aria-hidden>
          {CHAIN.slice(0, 3).map((d) => (
            <i key={d.id} style={vars({ '--c': d.color })} />
          ))}
        </span>
        M. I. Nasir
      </a>
      <nav className={s.chain} aria-label="Domains">
        {CHAIN.map((d) => (
          <a
            key={d.id}
            href={`#${d.id}`}
            className={d.id === active ? s.chainOn : undefined}
            style={vars({ '--c': d.color })}
            aria-current={d.id === active ? 'true' : undefined}
          >
            <i aria-hidden />
            <span className={s.chainN}>{d.n}</span>
            <span className={s.chainName}>{d.name}</span>
          </a>
        ))}
      </nav>
      <span
        className={s.now}
        style={vars({ '--c': cur.color })}
        aria-live="polite"
      >
        <i aria-hidden />
        {cur.n} {cur.name}
      </span>
      <div className={s.barLinks}>
        <Link href="/concepts">all cuts</Link>
        <a href={profile.resumeUrl}>Résumé</a>
      </div>
    </header>
  );
}

/** mix two #rrggbb colours */
const mix = (a: string, b: string, t: number) => {
  const p = (h: string) =>
    [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};

export default function InterfaceApp({
  fontClassName,
}: {
  fontClassName: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<DomainId>('identity');
  const inBand = useRef(false);

  // the home page may leave the body locked or the custom cursor on
  useEffect(() => {
    document.body.classList.remove('locked');
    document.documentElement.classList.remove('has-cursor');
  }, []);

  // smooth wheel scrolling tied to ScrollTrigger; touch stays native; off under reduced motion
  useEffect(() => {
    if (window.matchMedia(REDUCE).matches) return;
    const lenis = new Lenis({
      lerp: 0.12,
      wheelMultiplier: 0.9,
      anchors: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    let alive = true;
    document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());
    return () => {
      alive = false;
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const wires = Array.from(el.querySelectorAll<HTMLElement>('[data-wire]'));
    const bands = Array.from(el.querySelectorAll<HTMLElement>('[data-band]'));
    const heads = Array.from(el.querySelectorAll<HTMLElement>('[data-kin]'));
    const mm = gsap.matchMedia();
    mm.add({ all: 'all', desk: DESK, reduce: REDUCE }, (ctx) => {
      const { desk, reduce } = ctx.conditions as {
        desk: boolean;
        reduce: boolean;
      };
      if (reduce) {
        gsap.set(wires, { '--p': 1 });
        gsap.set(bands, { '--b': 1 });
        return;
      }
      // every wire fills up to the 60% line, so the signal front is one continuous line down the page
      wires.forEach((w) =>
        gsap.fromTo(
          w,
          { '--p': 0 },
          {
            '--p': 1,
            ease: 'none',
            scrollTrigger: {
              trigger: w,
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: true,
            },
          }
        )
      );
      // interfaces: the glyph runs its conversion, the line and Bit fade from one colour to the next
      bands.forEach((b) => {
        const c1 = D[b.dataset.from as DomainId].color;
        const c2 = D[b.dataset.to as DomainId].color;
        let half = false;
        ScrollTrigger.create({
          trigger: b,
          start: 'top 60%',
          end: 'bottom 60%',
          scrub: true,
          animation: gsap.fromTo(b, { '--b': 0 }, { '--b': 1, ease: 'none' }),
          onToggle: (self) => {
            inBand.current = self.isActive;
          },
          onUpdate: (self) => {
            el.style.setProperty('--bit', mix(c1, c2, self.progress));
            const h = self.progress > 0.5;
            if (h !== half) {
              half = h;
              window.dispatchEvent(new Event('bit:zap'));
            }
          },
        });
      });
      // kinetic type: each tagline starts wide and settles as it reaches the reading line
      heads.forEach((h) =>
        gsap.fromTo(
          h,
          { '--w': desk ? 118 : 108 },
          {
            '--w': desk ? 92 : 84,
            ease: 'none',
            scrollTrigger: {
              trigger: h,
              start: 'top 95%',
              end: 'top 45%',
              scrub: 0.4,
            },
          }
        )
      );
    });
    return () => mm.revert();
  }, []);

  // which domain is under the 60% line
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const secs = Array.from(el.querySelectorAll<HTMLElement>('[data-domain]'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            setActive((e.target as HTMLElement).dataset.domain as DomainId);
        });
      },
      { rootMargin: '-60% 0px -40% 0px' }
    );
    secs.forEach((x) => io.observe(x));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inBand.current)
      root.current?.style.setProperty('--bit', D[active].color);
  }, [active]);

  return (
    <div
      ref={root}
      className={`${s.root} ${fontClassName}`}
      style={vars({ '--bit': D.identity.color })}
    >
      <div className={s.aura} aria-hidden />
      <a href="#optics" className={s.skip}>
        Skip to the work
      </a>
      <Bar active={active} />
      <main>
        <Hero />

        <DomainSection
          d={D.optics}
          title="It starts with light."
          line="One frame from my robot arm. Follow it."
          band={
            <Band
              from={D.optics}
              to={D.ai}
              title="photons → tokens"
              unit="RGB888 → image/jpeg"
              say="I was light a second ago."
              glyph={<GlyphADC />}
            />
          }
        >
          <Group
            n="fig. 1 · thin lens → sensor → pixels"
            title="The sensor turns light into numbers."
            fig={<OpticsFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.ai}
          title="The model decides."
          line="At work I build LLM agents, and the code that checks them."
          band={
            <Band
              from={D.ai}
              to={D.software}
              title="tokens → JSON"
              unit="one field · three values"
              say="It picked grab. Good call."
              glyph={<GlyphJSON />}
            />
          }
        >
          <Group
            n="fig. 2a · the arm's brain"
            title="One frame in. One word out."
            fig={<AiArmFig />}
          />
          <Group
            n="fig. 2b · SAIF agent graph"
            title="Send a photo, get a design and a BOQ."
            ratio={480 / 800}
            fig={<AiSaifFig />}
          />
          <Group
            n="fig. 2c · Atomic Sensei"
            title="Lessons are generated before you open them."
            ratio={480 / 560}
            fig={<SenseiFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.software}
          title="Code carries it."
          line="Ordinary software, boring and well typed."
          band={
            <Band
              from={D.software}
              to={D.firmware}
              title="objects → bytes"
              unit="pyserial · 9600 baud · 8N1"
              say="Squeezing into five bytes."
              glyph={<GlyphUART />}
            />
          }
        >
          <Group
            n="fig. 3a · sequence + source"
            title="Six lines, from camera to serial port."
            fig={<SoftwareFig />}
          />
          <Group
            n="fig. 3b · pipelines"
            title="The data work under the agents."
            ratio={480 / 860}
            fig={<PlumbingFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.firmware}
          title="Bytes on a wire."
          line="Time in microseconds. Memory in bytes."
          band={
            <Band
              from={D.firmware}
              to={D.electronics}
              title="bits → volts"
              unit="digitalWrite(STEP, HIGH) · 5 V"
              say="Five volts. Hold on."
              glyph={<GlyphPin />}
            />
          }
        >
          <Group
            n="fig. 4 · UART frame, rx_buf, loop()"
            title="Five bytes. About five milliseconds."
            fig={<FirmwareFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.electronics}
          title="Volts become motion."
          band={
            <Band
              from={D.electronics}
              to={D.mechanics}
              title="current → torque"
              unit="A → N·m"
              say="Now I'm a twist."
              glyph={<GlyphMotor />}
            />
          }
        >
          <Group
            n="fig. 5a · schematic + timing, 0–20 ms"
            title="One edge. One step."
            ratio={480 / 720}
            fig={<ElectronicsFig />}
          />
          <Group
            n="fig. 5b · EMG chain"
            title="A muscle signal moves the arm."
            fig={<EmgFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.mechanics}
          title="Torque becomes position."
          line="Inverse kinematics for the arm, belt maths for the gantry."
          band={
            <Band
              from={D.mechanics}
              to={D.people}
              title="motion → people"
              unit="every machine here had a team"
              say="Who built all this?"
              glyph={<GlyphLoop />}
            />
          }
        >
          <Group
            n="fig. 6a · 4-DOF arm, inverse kinematics"
            title="Give it a point. Get the angles."
            fig={<MechArmFig />}
          />
          <Group
            n="fig. 6b · Core XY gantry, top view, 1:1"
            title="Two motors. Neither one moves."
            fig={<CoreXYFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.people}
          title="Machines need a team."
          line="Vice Chair of TSIG: 30 members, 10+ projects at once."
          band={
            <Band
              from={D.people}
              to={D.contact}
              title="team → you"
              unit="a loop needs a setpoint"
              say="Last hop. Your turn."
              glyph={<GlyphSum />}
            />
          }
        >
          <Group
            n="fig. 7a · a club day, one lead fanned out"
            title="Classes ended at four. That's when we started."
            fig={<PeopleFig />}
          />
          <Group
            n="fig. 7b · the route so far"
            title="Dubai. Hyderabad. Dubai."
            fig={<PlacesFig />}
          />
        </DomainSection>

        <DomainSection
          d={D.contact}
          title="Close the loop."
          line="Open to AI engineering roles, remote or in the UAE."
        >
          <Group
            n="fig. 8 · J1, contact header"
            title="Email works best."
            fig={<ContactFig />}
          />
        </DomainSection>
      </main>
      <footer className={s.foot}>
        <span>
          <Swatch d={D.contact} /> Mohammed Ibrahim Nasir · AI Engineer · Dubai
        </span>
        <span className={s.footLinks}>
          <a href="#top">back to 00 ↑</a>
          <Link href="/concepts">all cuts</Link>
          <a href={profile.resumeUrl}>résumé</a>
        </span>
        <span>
          colours: resistor code, 1 brown → 8 grey · psst, the signal has a
          debug port ( ` or tap Bit 5× )
        </span>
      </footer>
      <Bit root={root} at={active} />
    </div>
  );
}

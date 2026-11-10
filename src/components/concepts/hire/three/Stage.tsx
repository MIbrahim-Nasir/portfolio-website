'use client';

// One transparent WebGL canvas fixed over the page. Every 3D slot in the DOM is a drei <View>
// that the canvas scissors into, so the whole page costs a single GPU context.

import { View } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Arm, { Bench } from './Arm';
import { live } from './kit';
import {
  Bars,
  CoreXY,
  Dial,
  Graph,
  Hand,
  Mecanum,
  Printer,
  Rack,
  Tiles,
} from './Minis';

/** Views draw without clearing, so wipe the whole canvas first each frame. */
function Clear() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.clear(true, true, true);
  }, 1);
  return null;
}

export function Stage({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    live.reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const move = (e: PointerEvent) => {
      live.x = e.clientX;
      live.y = e.clientY;
      live.t = performance.now();
      const el = e.target instanceof Element ? e.target : null;
      live.label = el?.closest<HTMLElement>('[data-aim]')?.dataset.aim ?? '';
      live.grab = !!el?.closest('[data-grab]');
    };
    const leave = () => {
      live.t = -1e9;
      live.grab = false;
    };
    const pick = () => {
      live.picks += 1;
    };
    window.addEventListener('hire:pick', pick);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('hire:pick', pick);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <Canvas
      aria-hidden
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100lvh',
        pointerEvents: 'none',
        zIndex: 30,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NeutralToneMapping;
        onReady?.();
      }}
    >
      <Clear />
      <View.Port />
    </Canvas>
  );
}

export type SlotKind =
  | 'arm'
  | 'arm-small'
  | 'bench'
  | 'graph'
  | 'bars'
  | 'tiles'
  | 'dial'
  | 'rack'
  | 'corexy'
  | 'mecanum'
  | 'printer'
  | 'hand';

/** A DOM box that the canvas draws into. Size it with className; it fills the box. */
export function Slot({
  kind,
  aimId,
  hud,
}: {
  kind: SlotKind;
  aimId?: string;
  hud?: { angles?: string; target?: string; log?: string };
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const scene = (() => {
    switch (kind) {
      case 'arm':
        return <Arm wrap={wrap} bench aimId={aimId} hud={hud} />;
      case 'arm-small':
        return <Arm wrap={wrap} wide aimId={aimId} hud={hud} />;
      case 'bench':
        return <Bench wrap={wrap} />;
      case 'graph':
        return <Graph wrap={wrap} />;
      case 'bars':
        return <Bars wrap={wrap} />;
      case 'tiles':
        return <Tiles wrap={wrap} />;
      case 'dial':
        return <Dial wrap={wrap} />;
      case 'rack':
        return <Rack wrap={wrap} />;
      case 'corexy':
        return <CoreXY wrap={wrap} />;
      case 'mecanum':
        return <Mecanum wrap={wrap} />;
      case 'printer':
        return <Printer wrap={wrap} />;
      case 'hand':
        return <Hand wrap={wrap} />;
    }
  })();
  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <View index={2} style={{ position: 'absolute', inset: 0 }}>
        {scene}
      </View>
    </div>
  );
}

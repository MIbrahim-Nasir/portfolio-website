'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { Rig, type OverlayEls, type RigInputs } from './rig';

export type OverlayRefs = { [K in keyof OverlayEls]: RefObject<OverlayEls[K]> };

type Props = {
  inputs: RigInputs;
  overlay: OverlayRefs;
  onPick: (moduleIndex: number) => void;
  onDrone: () => void;
  onInteract: () => void;
};

function Bench({ inputs, overlay, onPick, onDrone, onInteract }: Props) {
  const rig = useMemo(() => new Rig(), []);
  const { gl, camera } = useThree();
  const cbs = useRef({ onPick, onDrone, onInteract });

  useEffect(() => {
    cbs.current = { onPick, onDrone, onInteract };
  }, [onPick, onDrone, onInteract]);

  useEffect(() => () => rig.dispose(), [rig]);

  useEffect(() => {
    rig.setInputs(inputs);
  }, [rig, inputs]);

  useEffect(() => {
    const el = gl.domElement;
    const ndc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
    };
    const down = (e: PointerEvent) => {
      if (e.button > 0) return;
      rig.pointerDown(e.clientX, e.clientY);
      if (e.pointerType === 'mouse') el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (rig.pointerMove(e.clientX, e.clientY)) cbs.current.onInteract();
      else if (e.pointerType === 'mouse')
        rig.hover(ndc(e), el, e.clientX, e.clientY);
    };
    const up = (e: PointerEvent) => {
      const moved = rig.pointerUp();
      if (moved < 8) {
        const hit = rig.pick(ndc(e), camera);
        if (hit === -2) {
          rig.poke();
          cbs.current.onDrone();
        } else if (hit >= 0) {
          cbs.current.onInteract();
          cbs.current.onPick(hit);
        }
      }
    };
    const cancel = () => void rig.pointerUp();
    const leave = () => rig.hover(null, el);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', leave);
    el.style.cursor = 'grab';
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('pointerleave', leave);
    };
  }, [gl, camera, rig]);

  useFrame((state, dt) => {
    const o = overlay;
    const ov: OverlayEls = {
      panel: o.panel.current,
      lead: o.lead.current,
      dot: o.dot.current,
      cone: o.cone.current,
      grad: o.grad.current,
      tags: o.tags.current ?? [],
      tagLines: o.tagLines.current,
      tagDots: o.tagDots.current,
      bubble: o.bubble.current,
      voice: o.voice.current,
      xy: o.xy.current,
      grip: o.grip.current,
      dialogue: o.dialogue.current,
      board: o.board.current,
    };
    rig.update(
      state.camera as THREE.PerspectiveCamera,
      state.size.width,
      state.size.height,
      dt,
      ov
    );
  });

  return <primitive object={rig.root} />;
}

export default function Scene(props: Props & { compact: boolean }) {
  return (
    <Canvas
      dpr={props.compact ? [1, 1.6] : [1, 2]}
      camera={{ fov: 32, near: 0.05, far: 60, position: [2.6, 1.6, 4.8] }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <Bench {...props} />
    </Canvas>
  );
}

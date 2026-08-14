'use client';

import { Suspense, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { rooms, type Mode } from './types';
import { DualCore } from './world/Core';
import { WorkField } from './world/WorkField';
import { CraftField } from './world/CraftField';
import { PathField } from './world/PathField';

function RoomGate({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const scale = useRef(active ? 1 : 0);
  useFrame(() => {
    if (!ref.current) return;
    scale.current += ((active ? 1 : 0) - scale.current) * 0.1;
    const s = scale.current;
    ref.current.scale.setScalar(Math.max(s, 0.001));
    ref.current.visible = s > 0.04;
  });
  return <group ref={ref}>{children}</group>;
}

function WriteBeacon() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.18;
      ref.current.rotation.x = 0.4 + Math.sin(s.clock.elapsedTime * 0.3) * 0.08;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <torusKnotGeometry args={[0.85, 0.18, 128, 16]} />
        <meshStandardMaterial
          color="#1a1814"
          metalness={0.85}
          roughness={0.22}
          envMapIntensity={1.2}
        />
      </mesh>
      <Sparkles count={18} scale={3.4} size={1.4} speed={0.2} color="#2f5f8a" />
    </group>
  );
}

function camGoal(mode: Mode, compact: boolean) {
  if (compact) {
    if (mode === 'work') return { x: 0, y: 0.12, z: 7.4 };
    if (mode === 'craft') return { x: 0, y: 0.25, z: 7.2 };
    if (mode === 'path') return { x: 0, y: 0.35, z: 7.6 };
    if (mode === 'ping') return { x: 0, y: 0.1, z: 5.6 };
    return { x: 0, y: 0.12, z: 6.4 };
  }
  if (mode === 'work') return { x: -0.85, y: 0.2, z: 6.6 };
  if (mode === 'craft') return { x: -0.55, y: 0.45, z: 6.6 };
  if (mode === 'path') return { x: -0.45, y: 0.45, z: 6.8 };
  if (mode === 'ping') return { x: -1.1, y: 0.15, z: 5.2 };
  return { x: 0, y: 0.18, z: 5.4 };
}

function Stage({
  mode,
  compact,
  workIndex,
  craftHot,
  pathIndex,
  onWork,
  onCraft,
  onPath,
}: {
  mode: Mode;
  compact: boolean;
  workIndex: number;
  craftHot: number;
  pathIndex: number;
  onWork: (i: number) => void;
  onCraft: (i: number) => void;
  onPath: (i: number) => void;
}) {
  const theme = rooms[mode];
  const cam = useRef({ x: 0, y: 0.2, z: 5.4 });

  useFrame((state) => {
    const goal = camGoal(mode, compact);
    const look = compact ? 0.08 : 0.45;
    cam.current.x += (goal.x + state.pointer.x * look - cam.current.x) * 0.05;
    cam.current.y += (goal.y + state.pointer.y * 0.18 - cam.current.y) * 0.05;
    cam.current.z += (goal.z - cam.current.z) * 0.05;
    state.camera.position.set(cam.current.x, cam.current.y, cam.current.z);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.bg, 7, 18]} />
      <ambientLight intensity={mode === 'ping' ? 0.7 : 0.32} />
      <spotLight
        position={[6, 8, 6]}
        intensity={mode === 'ping' ? 40 : 70}
        angle={0.38}
        color={theme.light}
      />
      <pointLight
        position={[-4, -1.5, 3]}
        intensity={14}
        color={theme.accent}
      />
      <RoomGate active={mode === 'home'}>
        <DualCore />
      </RoomGate>
      <RoomGate active={mode === 'work'}>
        <WorkField active={workIndex} onPick={onWork} />
      </RoomGate>
      <RoomGate active={mode === 'craft'}>
        <CraftField hot={craftHot} onHot={onCraft} />
      </RoomGate>
      <RoomGate active={mode === 'path'}>
        <PathField active={pathIndex} onPick={onPath} />
      </RoomGate>
      <RoomGate active={mode === 'ping'}>
        <WriteBeacon />
      </RoomGate>
      <ContactShadows
        position={[0, -2.05, 0]}
        opacity={mode === 'ping' ? 0.18 : 0.32}
        scale={12}
        blur={2.6}
      />
      <Environment preset={theme.env} />
    </>
  );
}

export default function World({
  mode,
  compact,
  workIndex,
  craftHot,
  pathIndex,
  onWork,
  onCraft,
  onPath,
}: {
  mode: Mode;
  compact: boolean;
  workIndex: number;
  craftHot: number;
  pathIndex: number;
  onWork: (i: number) => void;
  onCraft: (i: number) => void;
  onPath: (i: number) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5.4], fov: compact ? 48 : 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: false }}
      className="absolute inset-0 touch-none"
    >
      <Suspense fallback={null}>
        <Stage
          mode={mode}
          compact={compact}
          workIndex={workIndex}
          craftHot={craftHot}
          pathIndex={pathIndex}
          onWork={onWork}
          onCraft={onCraft}
          onPath={onPath}
        />
      </Suspense>
    </Canvas>
  );
}

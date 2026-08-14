'use client';

import { useState } from 'react';
import { Line, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { site } from '@/data/site';

function PathNode({
  position,
  active,
  onPick,
}: {
  position: THREE.Vector3;
  active: boolean;
  onPick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const on = active || hover;
  useCursor(hover);

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onPick();
      }}
    >
      <mesh>
        <sphereGeometry args={[on ? 0.22 : 0.14, 24, 24]} />
        <meshStandardMaterial
          color={on ? '#7a9ec4' : '#e6eef4'}
          metalness={0.55}
          roughness={0.25}
          emissive={on ? '#7a9ec4' : '#000000'}
          emissiveIntensity={hover ? 0.45 : active ? 0.22 : 0}
        />
      </mesh>
      {on ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.018, 8, 48]} />
          <meshBasicMaterial
            color="#7a9ec4"
            transparent
            opacity={hover ? 0.95 : 0.55}
          />
        </mesh>
      ) : null}
      <mesh>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function PathField({
  active,
  onPick,
}: {
  active: number;
  onPick: (i: number) => void;
}) {
  const pts = site.record.map((_, i) => {
    const a = i * 1.15;
    return new THREE.Vector3(
      Math.cos(a) * 1.7,
      i * 0.85 - 1.15,
      Math.sin(a) * 1.7
    );
  });
  const linePts = pts.map((p) => [p.x, p.y, p.z] as [number, number, number]);

  return (
    <group>
      <Line points={linePts} color="#7a9ec4" lineWidth={1.2} />
      {pts.map((p, i) => (
        <PathNode
          key={site.record[i].label}
          position={p}
          active={i === active}
          onPick={() => onPick(i)}
        />
      ))}
    </group>
  );
}

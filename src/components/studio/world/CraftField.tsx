'use client';

import { useState } from 'react';
import { Float, Image, Line, useCursor } from '@react-three/drei';
import { site } from '@/data/site';

const COLORS = ['#5b9bd4', '#cfd8e8', '#7a9ab0'] as const;

function Cluster({
  index,
  position,
  hot,
  onHot,
}: {
  index: number;
  position: [number, number, number];
  hot: number;
  onHot: (i: number) => void;
}) {
  const [hover, setHover] = useState(false);
  const on = hot === index || hover;
  useCursor(hover);
  const items = site.layers[index].items;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        onHot(index);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onHot(index);
      }}
    >
      <Float speed={1.1} floatIntensity={0.22}>
        <mesh scale={on ? 1.14 : 1}>
          {index === 0 ? (
            <icosahedronGeometry args={[0.58, 0]} />
          ) : index === 1 ? (
            <boxGeometry args={[0.9, 0.9, 0.9]} />
          ) : (
            <torusGeometry args={[0.48, 0.16, 16, 48]} />
          )}
          <meshStandardMaterial
            color={COLORS[index]}
            metalness={0.68}
            roughness={on ? 0.12 : 0.28}
            emissive={on ? COLORS[index] : '#000000'}
            emissiveIntensity={on ? 0.28 : 0}
          />
        </mesh>
      </Float>
      {items.map((item, k) => {
        const ang = (k / items.length) * Math.PI * 2 + index;
        const r = on ? 1.28 : 1.12;
        return (
          <mesh
            key={item.name}
            position={[
              Math.cos(ang) * r,
              Math.sin(ang) * 0.55,
              Math.sin(ang) * 0.2,
            ]}
          >
            <sphereGeometry args={[on ? 0.09 : 0.065, 16, 16]} />
            <meshStandardMaterial
              color={on ? '#5b9bd4' : '#9aa8b4'}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function CraftField({
  hot,
  onHot,
}: {
  hot: number;
  onHot: (i: number) => void;
}) {
  const pts: [number, number, number][] = [
    [-2.15, 0.35, 0],
    [0.1, -0.15, 0.35],
    [2.15, 0.25, -0.2],
  ];
  return (
    <group>
      {/* drei Image is a mesh texture, not an img */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        url="/images/tex-schematic.jpg"
        scale={[11, 6.2]}
        position={[0, 0, -3.2]}
        transparent
        opacity={0.2}
        toneMapped={false}
      />
      <Line points={pts} color="#3a4a58" lineWidth={1} />
      {pts.map((p, i) => (
        <Cluster
          key={site.layers[i].name}
          index={i}
          position={p}
          hot={hot}
          onHot={onHot}
        />
      ))}
    </group>
  );
}

'use client';

import { useState } from 'react';
import { Image, useCursor } from '@react-three/drei';
import { site } from '@/data/site';

function WorkCard({
  image,
  on,
  onPick,
}: {
  image: string;
  on: boolean;
  onPick: () => void;
}) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onPick();
      }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      scale={on || hover ? 1.04 : 1}
    >
      <mesh>
        <boxGeometry args={[2.28, 1.36, 0.06]} />
        <meshStandardMaterial
          color={on || hover ? '#7eb8d4' : '#151b22'}
          metalness={0.3}
          roughness={0.4}
          emissive={hover && !on ? '#7eb8d4' : '#000000'}
          emissiveIntensity={hover && !on ? 0.12 : 0}
        />
      </mesh>
      {/* drei Image is a mesh texture, not an img */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        url={image}
        scale={[2.16, 1.24]}
        position={[0, 0, 0.045]}
        toneMapped={false}
      />
    </group>
  );
}

export function WorkField({
  active,
  onPick,
}: {
  active: number;
  onPick: (i: number) => void;
}) {
  return (
    <group>
      {site.work.map((w, i) => {
        const offset = i - active;
        return (
          <group
            key={w.id}
            position={[offset * 1.45, 0, Math.abs(offset) * -1.15]}
            rotation={[0, offset * -0.42, 0]}
            scale={offset === 0 ? 1.12 : 0.78}
          >
            <WorkCard
              image={w.image}
              on={i === active}
              onPick={() => onPick(i)}
            />
          </group>
        );
      })}
    </group>
  );
}

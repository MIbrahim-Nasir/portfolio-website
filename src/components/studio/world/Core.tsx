'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function useSpinDrag() {
  const group = useRef<THREE.Group>(null);
  const drag = useRef({ down: false, x: 0, y: 0, vx: 0 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current.down || !group.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      group.current.rotation.y += dx * 0.01;
      group.current.rotation.x += dy * 0.008;
      drag.current.vx = dx * 0.01;
    };
    const up = () => {
      drag.current.down = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  useFrame((state) => {
    if (!group.current || drag.current.down) return;
    group.current.rotation.y += drag.current.vx + 0.004;
    group.current.rotation.x += Math.sin(state.clock.elapsedTime * 0.4) * 0.001;
    drag.current.vx *= 0.95;
  });

  const onPointerDown = (e: {
    stopPropagation: () => void;
    nativeEvent: PointerEvent;
  }) => {
    e.stopPropagation();
    drag.current.down = true;
    drag.current.x = e.nativeEvent.clientX;
    drag.current.y = e.nativeEvent.clientY;
  };

  return { group, onPointerDown };
}

export function DualCore({ scale = 1 }: { scale?: number }) {
  const { group, onPointerDown } = useSpinDrag();

  return (
    <group ref={group} scale={scale} onPointerDown={onPointerDown}>
      <mesh>
        <sphereGeometry args={[1.05, 64, 64]} />
        <MeshDistortMaterial
          color="#3d6ea8"
          speed={1.6}
          distort={0.38}
          radius={1}
          metalness={0.72}
          roughness={0.18}
          envMapIntensity={1.3}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.28, 0]} />
        <meshBasicMaterial
          color="#ece8e0"
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.72, 0.012, 12, 96]} />
        <meshBasicMaterial color="#7eb8e8" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[0.5, 0.3, 0.8]}>
        <torusGeometry args={[1.95, 0.008, 12, 96]} />
        <meshBasicMaterial color="#ece8e0" transparent opacity={0.28} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 2.15,
            Math.sin((i / 3) * Math.PI * 2) * 0.35,
            Math.sin((i / 3) * Math.PI * 2) * 2.15,
          ]}
        >
          <octahedronGeometry args={[0.08, 0]} />
          <meshStandardMaterial
            color="#5b9bd4"
            metalness={0.8}
            roughness={0.2}
            emissive="#5b9bd4"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
      <Sparkles count={28} scale={5} size={1.8} speed={0.28} color="#7eb8e8" />
    </group>
  );
}

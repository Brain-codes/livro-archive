"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function OpenBook() {
  const group = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={group as never}>
        <mesh position={[-0.55, 0, 0]} rotation={[0.05, 0.35, 0]}>
          <boxGeometry args={[1, 1.35, 0.06]} />
          <meshStandardMaterial color="#f5f1e9" roughness={0.6} />
        </mesh>
        <mesh position={[0.55, 0, 0]} rotation={[0.05, -0.35, 0]}>
          <boxGeometry args={[1, 1.35, 0.06]} />
          <meshStandardMaterial color="#f5f1e9" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.05, 0.04]}>
          <boxGeometry args={[2.05, 0.08, 0.14]} />
          <meshStandardMaterial color="#7a2230" roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

export function HeroScene() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0.4, 3.2], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 2]} intensity={1.2} />
        <OpenBook />
        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}

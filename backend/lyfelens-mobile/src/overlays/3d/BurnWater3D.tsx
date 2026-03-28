/**
 * BurnWater3D — React Three Fiber 3D water particle system
 * Simulates cool water being poured downward onto the burn area
 * anchored to left_wrist MoveNet keypoint.
 * Light sky-blue palette for AR user-friendliness.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

const PARTICLE_COUNT = 40;

// Individual water drop
function WaterDrop({
  startX,
  startZ,
  delay,
  speed,
}: {
  startX: number;
  startZ: number;
  delay: number;
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initY = 160 + Math.random() * 40;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.getElapsedTime() + delay) * speed;
    // Y falls from +initY down to -40
    const y = initY - (t % 1) * (initY + 40);
    meshRef.current.position.y = y;
    // Slight wobble
    meshRef.current.position.x = startX + Math.sin(t * 3 + delay) * 4;

    // Fade out as it hits the burn area
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const fadeStart = 30;
    mat.opacity = y > fadeStart ? 0.75 : Math.max(0, (y - (-40)) / (fadeStart + 40)) * 0.75;
  });

  return (
    <mesh ref={meshRef} position={[startX, 0, startZ]}>
      <sphereGeometry args={[3 + Math.random() * 3, 8, 8]} />
      <meshStandardMaterial
        color="#66BBFF"
        transparent
        opacity={0.75}
        roughness={0.05}
        metalness={0.1}
      />
    </mesh>
  );
}

// Water stream (thick rope-like cylinder that animates flow)
function WaterStream({ xOffset }: { xOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseOpacity = 0.35 + Math.random() * 0.2;
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = baseOpacity + Math.sin(t * 4 + xOffset) * 0.1;
    // Slight sway
    meshRef.current.position.x = xOffset + Math.sin(t * 2 + xOffset * 0.5) * 5;
  });
  return (
    <mesh ref={meshRef} position={[xOffset, 80, 0]}>
      <cylinderGeometry args={[4, 2, 160, 12]} />
      <meshStandardMaterial
        color="#88D8FF"
        transparent
        opacity={baseOpacity}
        roughness={0.1}
        metalness={0.05}
      />
    </mesh>
  );
}

// Splash effect at the bottom
function Splash() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Scale and fade
    const pulse = (Math.sin(t * 3) + 1) / 2;
    groupRef.current.scale.set(1 + pulse * 0.4, 1, 1 + pulse * 0.4);
  });
  return (
    <group ref={groupRef} position={[0, -30, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[1, 1.6, 2.2].map((r, i) => (
        <mesh key={i}>
          <ringGeometry args={[r * 15, r * 15 + 3, 48]} />
          <meshBasicMaterial
            color="#88D8FF"
            transparent
            opacity={0.4 - i * 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Faucet / tap head at the top
function FaucetHead() {
  return (
    <group position={[0, 160, 0]}>
      {/* Pipe horizontal */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[8, 8, 70, 16]} />
        <meshStandardMaterial color="#A8D8F0" roughness={0.2} metalness={0.3} transparent opacity={0.85} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 12, 0]}>
        <boxGeometry args={[30, 8, 8]} />
        <meshStandardMaterial color="#B8E4FF" roughness={0.3} metalness={0.2} transparent opacity={0.9} />
      </mesh>
      {/* Spout nozzle */}
      <mesh position={[0, -10, 0]}>
        <cylinderGeometry args={[10, 14, 16, 16]} />
        <meshStandardMaterial color="#A8D8F0" roughness={0.2} metalness={0.3} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// Burn area indicator (where water should hit)
function BurnZone() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
  });
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -35, 0]}>
      {/* Burn zone ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[38, 45, 48]} />
        <meshBasicMaterial color="#FF9966" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner area */}
      <mesh>
        <circleGeometry args={[38, 48]} />
        <meshBasicMaterial color="#FFCCAA" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

type BurnWater3DProps = {
  worldX: number;
  worldY: number;
};

export default function BurnWater3D({ worldX, worldY }: BurnWater3DProps) {
  // Generate particles with staggered delays and positions
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 50,
      startZ: (Math.random() - 0.5) * 10,
      delay: Math.random() * 2,
      speed: 0.6 + Math.random() * 0.4,
    })),
  []);

  return (
    <group position={[worldX, worldY, 0]}>
      {/* === LIGHTS === */}
      <ambientLight intensity={1.0} color="#E8F4FF" />
      <pointLight position={[0, 200, 0]} intensity={1.2} color="#AADDFF" />
      <pointLight position={[0, -100, 0]} intensity={0.5} color="#FFFFFF" />

      {/* === FAUCET AT TOP === */}
      <FaucetHead />

      {/* === WATER STREAMS (3 parallel streams) === */}
      {[-20, 0, 20].map(x => (
        <WaterStream key={x} xOffset={x} />
      ))}

      {/* === WATER PARTICLES (drops) === */}
      {particles.map(p => (
        <WaterDrop
          key={p.id}
          startX={p.startX}
          startZ={p.startZ}
          delay={p.delay}
          speed={p.speed}
        />
      ))}

      {/* === SPLASH AT BOTTOM === */}
      <Splash />

      {/* === BURN ZONE INDICATOR === */}
      <BurnZone />
    </group>
  );
}

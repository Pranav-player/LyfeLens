/**
 * BurnWater3D — Realistic hand pouring water from bottle onto burn
 * 
 * Shows an anatomically correct 3D hand gripping a water bottle
 * tilted to pour cool water onto the burn area. Includes water
 * particle system, splash effects, and EMA tracking.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// =============================================================================
// SKIN MATERIALS
// =============================================================================
const SKIN = {
  palm: '#E8B99A',
  finger: '#DBA88A',
  knuckle: '#C89878',
  back: '#D4A07A',
};

function SkinMat({ color, roughness = 0.55 }: { color: string; roughness?: number }) {
  return <meshBasicMaterial color={color} />;
}

// =============================================================================
// WATER BOTTLE
// =============================================================================
function WaterBottle() {
  return (
    <group>
      {/* Bottle body */}
      <mesh>
        <cylinderGeometry args={[10, 10, 55, 16]} />
        <meshBasicMaterial color="#C8E8FF" transparent opacity={0.65} />
      </mesh>
      {/* Bottle neck */}
      <mesh position={[0, 32, 0]}>
        <cylinderGeometry args={[5, 7, 12, 12]} />
        <meshBasicMaterial color="#B8DDFF" roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 39, 0]}>
        <cylinderGeometry args={[6, 6, 4, 12]} />
        <meshBasicMaterial color="#4488CC" roughness={0.3} />
      </mesh>
      {/* Water level inside */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[9, 9, 35, 16]} />
        <meshBasicMaterial color="#4499DD" roughness={0.05} transparent opacity={0.4} />
      </mesh>
      {/* Label band */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[10.5, 10.5, 20, 16]} />
        <meshBasicMaterial color="#FFFFFF" roughness={0.4} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// =============================================================================
// HAND GRIPPING BOTTLE
// =============================================================================
function GrippingHand() {
  const fingerPositions = [
    { x: -10, len: 20, r: 2.8, curl: 1.8 },
    { x: -3.5, len: 23, r: 3.0, curl: 1.7 },
    { x: 3.5, len: 22, r: 2.9, curl: 1.8 },
    { x: 10, len: 18, r: 2.5, curl: 1.9 },
  ];

  return (
    <group position={[0, 0, 14]}>
      {/* Palm behind bottle */}
      <mesh scale={[0.8, 0.25, 0.6]}>
        <sphereGeometry args={[20, 12, 12]} />
        <SkinMat color={SKIN.palm} />
      </mesh>

      {/* Fingers wrapping around bottle */}
      {fingerPositions.map((f, i) => (
        <group key={i} position={[f.x, 5 + i * 3, -10]}>
          {/* Knuckle */}
          <mesh>
            <sphereGeometry args={[f.r * 1.1, 8, 8]} />
            <SkinMat color={SKIN.knuckle} roughness={0.65} />
          </mesh>
          {/* Finger wrapping around (high curl) */}
          <mesh rotation={[f.curl, 0, 0]}>
            <cylinderGeometry args={[f.r, f.r, f.len * 0.5, 8]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Fingertip on other side */}
          <mesh position={[0, -f.len * 0.3, -12]} rotation={[2.2, 0, 0]}>
            <cylinderGeometry args={[f.r * 0.8, f.r * 0.8, f.len * 0.35, 8]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
        </group>
      ))}

      {/* Thumb on front of bottle */}
      <group position={[-14, 8, -5]} rotation={[0.3, 0.4, -0.4]}>
        <mesh>
          <cylinderGeometry args={[4, 4, 9, 8]} />
          <SkinMat color={SKIN.palm} />
        </mesh>
        <mesh position={[0, -8, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[3.5, 3.5, 7, 8]} />
          <SkinMat color={SKIN.finger} />
        </mesh>
      </group>

      {/* Wrist */}
      <mesh position={[0, 0, 16]}>
        <cylinderGeometry args={[10, 10, 10, 10]} />
        <SkinMat color={SKIN.back} />
      </mesh>

      {/* Forearm */}
      <mesh position={[0, 0, 30]}>
        <cylinderGeometry args={[9, 9, 18, 10]} />
        <SkinMat color={SKIN.back} roughness={0.6} />
      </mesh>
    </group>
  );
}

// =============================================================================
// WATER DROPS
// =============================================================================
const PARTICLE_COUNT = 35;

function WaterDrop({ startX, startZ, delay, speed }: {
  startX: number; startZ: number; delay: number; speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initY = 140 + Math.random() * 30;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.getElapsedTime() + delay) * speed;
    const y = initY - (t % 1) * (initY + 40);
    meshRef.current.position.y = y;
    meshRef.current.position.x = startX + Math.sin(t * 3 + delay) * 3;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const fadeStart = 30;
    mat.opacity = y > fadeStart ? 0.8 : Math.max(0, (y + 40) / (fadeStart + 40)) * 0.8;
  });

  return (
    <mesh ref={meshRef} position={[startX, 0, startZ]}>
      <sphereGeometry args={[2.5 + Math.random() * 2.5, 8, 8]} />
      <meshBasicMaterial color="#55BBFF" transparent opacity={0.8} />
    </mesh>
  );
}

// =============================================================================
// WATER STREAMS
// =============================================================================
function WaterStream({ xOffset }: { xOffset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseOp = 0.35 + Math.random() * 0.15;
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = baseOp + Math.sin(t * 4 + xOffset) * 0.1;
    meshRef.current.position.x = xOffset + Math.sin(t * 2 + xOffset * 0.5) * 4;
  });
  return (
    <mesh ref={meshRef} position={[xOffset, 60, 0]}>
      <cylinderGeometry args={[3.5, 1.5, 140, 10]} />
      <meshBasicMaterial color="#77CCFF" transparent opacity={baseOp} />
    </mesh>
  );
}

// =============================================================================
// SPLASH EFFECT
// =============================================================================
function Splash() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = (Math.sin(clock.getElapsedTime() * 3) + 1) / 2;
    groupRef.current.scale.set(1 + pulse * 0.4, 1, 1 + pulse * 0.4);
  });
  return (
    <group ref={groupRef} position={[0, -38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[1, 1.6, 2.2].map((r, i) => (
        <mesh key={i}>
          <ringGeometry args={[r * 14, r * 14 + 3, 48]} />
          <meshBasicMaterial color="#88D8FF" transparent opacity={0.4 - i * 0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// BURN ZONE
// =============================================================================
function BurnZone() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
  });
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -40, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[38, 45, 48]} />
        <meshBasicMaterial color="#FF9966" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <circleGeometry args={[38, 48]} />
        <meshBasicMaterial color="#FFCCAA" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
type Props = { worldX: number; worldY: number };

export default function BurnWater3D({ worldX, worldY }: Props) {
  const targetX = useRef(worldX);
  const targetY = useRef(worldY);
  const groupRef = useRef<THREE.Group>(null);

  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 40,
      startZ: (Math.random() - 0.5) * 8,
      delay: Math.random() * 2,
      speed: 0.6 + Math.random() * 0.4,
    })),
  []);

  useFrame(() => {
    // EMA smoothing
    targetX.current = targetX.current * 0.7 + worldX * 0.3;
    targetY.current = targetY.current * 0.7 + worldY * 0.3;
    if (groupRef.current) {
      groupRef.current.position.x = targetX.current;
      groupRef.current.position.y = targetY.current;
    }
  });

  return (
    <group ref={groupRef} position={[worldX, worldY, 0]}>
      <ambientLight intensity={1.0} color="#F0F8FF" />
      <pointLight position={[0, 200, 0]} intensity={1.5} color="#AADDFF" />
      <pointLight position={[-80, 50, 80]} intensity={0.5} color="#FFE8CC" />

      {/* === HAND HOLDING BOTTLE (tilted to pour) === */}
      <group position={[15, 130, 0]} rotation={[0, 0, -0.5]}>
        <WaterBottle />
        <GrippingHand />
      </group>

      {/* === WATER STREAMS === */}
      {[-15, 0, 15].map(x => (
        <WaterStream key={x} xOffset={x} />
      ))}

      {/* === WATER PARTICLES === */}
      {particles.map(p => (
        <WaterDrop key={p.id} startX={p.startX} startZ={p.startZ} delay={p.delay} speed={p.speed} />
      ))}

      {/* === SPLASH AT BOTTOM === */}
      <Splash />

      {/* === BURN ZONE INDICATOR === */}
      <BurnZone />
    </group>
  );
}

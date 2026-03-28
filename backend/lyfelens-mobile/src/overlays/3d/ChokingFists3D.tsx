/**
 * ChokingFists3D — Anatomically correct fists for Heimlich maneuver
 * 
 * Shows two realistic human fists positioned at the abdomen,
 * performing inward-upward thrust animation.
 * Fists have proper finger segments curled into a ball.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// =============================================================================
// SKIN MATERIALS
// =============================================================================
const SKIN = {
  palm: '#E8B99A',
  finger: '#DBA88A',
  knuckle: '#C89878',
  nail: '#F0C8B8',
  back: '#D4A07A',
};

function SkinMat({ color, roughness = 0.55 }: { color: string; roughness?: number }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0.02} />;
}

// =============================================================================
// REALISTIC FIST — fingers curled into a tight ball
// =============================================================================
function RealisticFist({ side, thrustT }: { side: 'left' | 'right'; thrustT: number }) {
  const dir = side === 'left' ? 1 : -1;
  const baseX = dir * 75;
  const thrustX = -dir * thrustT * 30;
  const thrustY = thrustT * 18;

  const fingerXPositions = [-10, -3.5, 3.5, 10];

  return (
    <group position={[baseX + thrustX, thrustY, 0]}>
      {/* === PALM (back of fist facing outward) === */}
      <mesh scale={[1.0, 0.9, 0.7]}>
        <sphereGeometry args={[18, 14, 14]} />
        <SkinMat color={SKIN.back} />
      </mesh>

      {/* === KNUCKLE RIDGE (top of fist) === */}
      {fingerXPositions.map((x, i) => (
        <mesh key={`k${i}`} position={[x, 12, -4]}>
          <sphereGeometry args={[4.5, 8, 8]} />
          <SkinMat color={SKIN.knuckle} roughness={0.65} />
        </mesh>
      ))}

      {/* === CURLED FINGERS (visible from front, tucked under) === */}
      {fingerXPositions.map((x, i) => (
        <group key={`f${i}`} position={[x, 8, -10]}>
          {/* Proximal (curled forward) */}
          <mesh rotation={[1.2, 0, 0]}>
            <capsuleGeometry args={[3.2 - i * 0.15, 10 + (1 - Math.abs(i - 1.5)) * 2, 6, 8]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Middle (tucked under) */}
          <mesh position={[0, -5, -10]} rotation={[2.0, 0, 0]}>
            <capsuleGeometry args={[2.8 - i * 0.1, 8, 6, 8]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Fingertip (curled into palm) */}
          <mesh position={[0, -2, -14]} rotation={[2.5, 0, 0]}>
            <capsuleGeometry args={[2.4, 6, 6, 8]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
        </group>
      ))}

      {/* === THUMB (wrapped over fingers) === */}
      <group position={[dir * -16, 4, -6]} rotation={[0.8, dir * 0.3, -dir * 0.4]}>
        <mesh>
          <capsuleGeometry args={[4.5, 8, 6, 10]} />
          <SkinMat color={SKIN.palm} />
        </mesh>
        <mesh position={[0, -8, 0]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[3.8, 7, 6, 10]} />
          <SkinMat color={SKIN.finger} />
        </mesh>
        {/* Thumbnail */}
        <mesh position={[0, -12, -3]}>
          <boxGeometry args={[4, 4.5, 0.7]} />
          <SkinMat color={SKIN.nail} roughness={0.3} />
        </mesh>
      </group>

      {/* === WRIST === */}
      <mesh position={[0, 0, 16]}>
        <capsuleGeometry args={[10, 10, 8, 10]} />
        <SkinMat color={SKIN.back} />
      </mesh>

      {/* === FOREARM === */}
      <mesh position={[dir * 8, 0, 32]} rotation={[0, -dir * 0.2, 0]}>
        <capsuleGeometry args={[9, 22, 8, 10]} />
        <SkinMat color={SKIN.back} roughness={0.6} />
      </mesh>

      {/* Glow on thrust */}
      <pointLight
        position={[0, 0, -10]}
        intensity={0.3 + thrustT * 0.5}
        color="#FFE8CC"
        distance={60}
      />
    </group>
  );
}

// =============================================================================
// UPWARD THRUST ARROWS
// =============================================================================
function ThrustArrows({ thrustT }: { thrustT: number }) {
  return (
    <group position={[0, -20 + thrustT * 15, 0]}>
      {[-20, 0, 20].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[2.5, 2.5, 35, 8]} />
            <meshBasicMaterial color="#FFCC44" transparent opacity={0.45 + thrustT * 0.4} />
          </mesh>
          <mesh position={[0, 26, 0]}>
            <coneGeometry args={[7, 14, 8]} />
            <meshBasicMaterial color="#FFCC44" transparent opacity={0.6 + thrustT * 0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// ABDOMINAL TARGET ZONE
// =============================================================================
function AbdominalZone() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.15 + Math.sin(clock.getElapsedTime() * 2) * 0.07;
  });
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <mesh ref={meshRef} scale={[1.57, 1, 1]}>
        <circleGeometry args={[35, 48]} />
        <meshBasicMaterial color="#FFCC66" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[1.57, 1, 1]}>
        <ringGeometry args={[35, 38, 48]} />
        <meshBasicMaterial color="#FFAA44" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
type Props = { worldX: number; worldY: number };

export default function ChokingFists3D({ worldX, worldY }: Props) {
  const thrustTRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const targetX = useRef(worldX);
  const targetY = useRef(worldY);

  useFrame(({ clock }) => {
    // EMA smoothing
    targetX.current = targetX.current * 0.7 + worldX * 0.3;
    targetY.current = targetY.current * 0.7 + worldY * 0.3;
    if (groupRef.current) {
      groupRef.current.position.x = targetX.current;
      groupRef.current.position.y = targetY.current;
    }

    // Thrust pattern: quick inward + hold + slow release
    const t = clock.getElapsedTime();
    const beat = (t * 2) % 1;
    if (beat < 0.25) {
      thrustTRef.current = beat / 0.25;
    } else if (beat < 0.4) {
      thrustTRef.current = 1;
    } else {
      thrustTRef.current = 1 - (beat - 0.4) / 0.6;
    }
  });

  return (
    <group ref={groupRef} position={[worldX, worldY, 0]}>
      <ambientLight intensity={1.0} color="#FFF5E8" />
      <pointLight position={[0, 150, -80]} intensity={1.5} color="#FFE8CC" />
      <pointLight position={[0, -80, 100]} intensity={0.5} color="#FFFFFF" />

      <AbdominalZone />
      <RealisticFist side="left" thrustT={thrustTRef.current} />
      <RealisticFist side="right" thrustT={thrustTRef.current} />
      <ThrustArrows thrustT={thrustTRef.current} />
    </group>
  );
}

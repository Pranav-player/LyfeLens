/**
 * BleedingBandage3D — Realistic hand pressing bandage on wound
 * 
 * Shows an anatomically correct 3D hand pressing a cloth bandage
 * firmly onto the wound area with rhythmic pressure animation.
 * Uses the same realistic finger/palm system as CPRHands3D.
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
// REALISTIC PRESSING HAND (simplified for performance — palm + fingers curled)
// =============================================================================
function PressingHand({ pressY }: { pressY: number }) {
  const fingerPositions = [
    { x: -15, len: 22, r: 2.8 },  // Index
    { x: -5,  len: 25, r: 3.0 },  // Middle
    { x: 5,   len: 24, r: 2.9 },  // Ring
    { x: 14,  len: 19, r: 2.5 },  // Pinky
  ];

  return (
    <group position={[0, pressY + 20, 0]}>
      {/* Palm — rounded */}
      <mesh scale={[1.0, 0.28, 0.7]}>
        <sphereGeometry args={[28, 14, 14]} />
        <SkinMat color={SKIN.palm} />
      </mesh>

      {/* Palm pad (heel pressing into bandage) */}
      <mesh position={[0, -3, 12]} scale={[0.8, 0.3, 0.5]}>
        <sphereGeometry args={[22, 10, 10]} />
        <SkinMat color={SKIN.palm} roughness={0.7} />
      </mesh>

      {/* 4 Fingers curled around bandage */}
      {fingerPositions.map((f, i) => (
        <group key={i} position={[f.x, 0, -18]}>
          {/* Knuckle */}
          <mesh position={[0, 4, 0]}>
            <sphereGeometry args={[f.r * 1.2, 8, 8]} />
            <SkinMat color={SKIN.knuckle} roughness={0.65} />
          </mesh>
          {/* Finger curled down */}
          <mesh rotation={[0.6, 0, 0]}>
            <capsuleGeometry args={[f.r, f.len, 6, 10]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Fingertip */}
          <mesh position={[0, -f.len * 0.6, -f.len * 0.35]} rotation={[1.0, 0, 0]}>
            <capsuleGeometry args={[f.r * 0.85, f.len * 0.45, 6, 10]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Nail */}
          <mesh position={[0, -f.len * 0.75, -f.len * 0.55]}>
            <boxGeometry args={[f.r * 1.3, f.r * 1.5, 0.7]} />
            <SkinMat color={SKIN.nail} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Thumb wrapping around side */}
      <group position={[-26, 0, 0]} rotation={[0.2, 0.5, -0.5]}>
        <mesh>
          <capsuleGeometry args={[4, 10, 6, 10]} />
          <SkinMat color={SKIN.palm} />
        </mesh>
        <mesh position={[0, -10, 0]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[3.5, 8, 6, 10]} />
          <SkinMat color={SKIN.finger} />
        </mesh>
      </group>

      {/* Wrist */}
      <mesh position={[0, 0, 22]}>
        <capsuleGeometry args={[12, 12, 8, 10]} />
        <SkinMat color={SKIN.back} />
      </mesh>

      {/* Forearm */}
      <mesh position={[0, 0, 38]}>
        <capsuleGeometry args={[10, 18, 8, 10]} />
        <SkinMat color={SKIN.back} roughness={0.6} />
      </mesh>

      {/* Shadow */}
      <mesh position={[0, -18, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.5, 1, 1]}>
        <circleGeometry args={[22, 24]} />
        <meshBasicMaterial color="#3A2010" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// =============================================================================
// BANDAGE CLOTH
// =============================================================================
function Bandage({ pressY }: { pressY: number }) {
  return (
    <group position={[0, pressY, 0]}>
      {/* Main cloth */}
      <mesh>
        <boxGeometry args={[70, 3, 45]} />
        <meshStandardMaterial color="#F9F5F0" roughness={0.85} opacity={0.94} transparent />
      </mesh>

      {/* Gauze weave pattern */}
      {[-22, -8, 6, 20].map((x, i) => (
        <group key={i} position={[x, 2, 0]}>
          <mesh>
            <boxGeometry args={[6, 0.8, 34]} />
            <meshBasicMaterial color="#E8DDD5" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      {[-14, 0, 14].map((z, i) => (
        <mesh key={`h${i}`} position={[0, 2, z]}>
          <boxGeometry args={[60, 0.8, 4]} />
          <meshBasicMaterial color="#E8DDD5" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Red blood stain seeping through */}
      <mesh position={[5, 2.5, -3]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <circleGeometry args={[12, 16]} />
        <meshBasicMaterial color="#CC3333" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Bandage edges */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[0, 0, side * 21]}>
          <boxGeometry args={[70, 4, 4]} />
          <meshStandardMaterial color="#DDD0C8" roughness={0.7} opacity={0.85} transparent />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// WOUND ZONE INDICATOR
// =============================================================================
function WoundIndicator() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const pulse = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.2 + pulse * 0.2;
    ringRef.current.scale.set(1 + pulse * 0.15, 1, 1 + pulse * 0.15);
  });
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[35, 42, 48]} />
        <meshBasicMaterial color="#FF6B6B" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// =============================================================================
// PRESSURE ARROWS
// =============================================================================
function PressArrows() {
  return (
    <group>
      {[-25, 0, 25].map((x, i) => (
        <group key={i} position={[x, 90, 0]}>
          <mesh>
            <cylinderGeometry args={[2.5, 2.5, 30, 8]} />
            <meshBasicMaterial color="#FF9977" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, -22, 0]}>
            <coneGeometry args={[8, 14, 8]} />
            <meshBasicMaterial color="#FF7755" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
type Props = { worldX: number; worldY: number };

export default function BleedingBandage3D({ worldX, worldY }: Props) {
  const pressY = useRef(0);
  const targetX = useRef(worldX);
  const targetY = useRef(worldY);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    // EMA smoothing
    targetX.current = targetX.current * 0.7 + worldX * 0.3;
    targetY.current = targetY.current * 0.7 + worldY * 0.3;
    if (groupRef.current) {
      groupRef.current.position.x = targetX.current;
      groupRef.current.position.y = targetY.current;
    }

    // Rhythmic pressing
    const t = clock.getElapsedTime();
    const beat = (t * 0.8) % 1;
    if (beat < 0.4) {
      pressY.current = -(beat / 0.4) * 18;
    } else if (beat < 0.6) {
      pressY.current = -18;
    } else {
      pressY.current = -18 + ((beat - 0.6) / 0.4) * 18;
    }
  });

  return (
    <group ref={groupRef} position={[worldX, worldY, 0]}>
      <ambientLight intensity={1.0} color="#FFF5E8" />
      <pointLight position={[0, 200, -100]} intensity={1.5} color="#FFE8CC" />
      <pointLight position={[0, -100, 100]} intensity={0.5} color="#FFFFFF" />

      <WoundIndicator />
      <PressArrows />
      <Bandage pressY={pressY.current} />
      <PressingHand pressY={pressY.current} />
    </group>
  );
}

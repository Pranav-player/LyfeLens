/**
 * ChokingFists3D — 3D Heimlich maneuver fist animation
 * Two fists thrust inward+upward toward abdominal area.
 * Warm golden/peach palette.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

function Fist({
  side,
  thrustT,
}: {
  side: 'left' | 'right';
  thrustT: number;
}) {
  const dir = side === 'left' ? 1 : -1;
  const baseX = dir * 80;
  const thrustX = -dir * thrustT * 35;
  const thrustY = thrustT * 20; // upward on thrust

  return (
    <group position={[baseX + thrustX, thrustY, 0]}>
      {/* Fist body */}
      <mesh>
        <boxGeometry args={[30, 24, 28]} />
        <meshStandardMaterial color="#e3bca5" roughness={0.6} />
      </mesh>

      {/* Finger tops (knuckle row) */}
      {[-9, -3, 3, 9].map((x, i) => (
        <mesh key={i} position={[x, 13, -6]}>
          <boxGeometry args={[5.5, 6, 14]} />
          <meshStandardMaterial color="#d2a68d" roughness={0.6} />
        </mesh>
      ))}

      {/* Thumb */}
      <mesh position={[dir * -16, 0, 8]} rotation={[0, dir * 0.4, 0]}>
        <boxGeometry args={[10, 16, 10]} />
        <meshStandardMaterial color="#d2a68d" roughness={0.6} />
      </mesh>

      {/* Wrist */}
      <mesh position={[0, -16, 0]}>
        <cylinderGeometry args={[13, 15, 14, 12]} />
        <meshStandardMaterial color="#e3bca5" roughness={0.6} />
      </mesh>

      {/* Glow */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.4 + thrustT * 0.6}
        color="#FFDD99"
        distance={80}
      />
    </group>
  );
}

// Upward thrust arrows
function ThrustArrows({ thrustT }: { thrustT: number }) {
  return (
    <group position={[0, -20 + thrustT * 15, 0]}>
      {[-25, 0, 25].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[2, 2, 40, 8]} />
            <meshBasicMaterial color="#FFCC44" transparent opacity={0.5 + thrustT * 0.4} />
          </mesh>
          <mesh position={[0, 28, 0]}>
            <coneGeometry args={[7, 14, 8]} />
            <meshBasicMaterial color="#FFCC44" transparent opacity={0.7 + thrustT * 0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Abdominal target zone
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

type ChokingFists3DProps = {
  worldX: number;
  worldY: number;
};

export default function ChokingFists3D({ worldX, worldY }: ChokingFists3DProps) {
  const thrustTRef = useRef(0);
  const dummyGroup = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Thrust pattern: 2 thrusts per second, quick inward + slow release
    const beat = (t * 2) % 1;
    if (beat < 0.25) {
      thrustTRef.current = beat / 0.25; // thrust in
    } else if (beat < 0.4) {
      thrustTRef.current = 1; // hold at max
    } else {
      thrustTRef.current = 1 - (beat - 0.4) / 0.6; // release
    }
    if (dummyGroup.current) {
      dummyGroup.current.userData.thrustT = thrustTRef.current;
    }
  });

  return (
    <group ref={dummyGroup} position={[worldX, worldY, 0]}>
      {/* === LIGHTS === */}
      <ambientLight intensity={1.1} color="#FFF3E0" />
      <pointLight position={[0, 150, -80]} intensity={1.3} color="#FFDD99" />
      <directionalLight position={[0, 100, 100]} intensity={0.6} color="#FFFFFF" />

      {/* === ABDOMINAL TARGET === */}
      <AbdominalZone />

      {/* === FISTS === */}
      <Fist side="left" thrustT={thrustTRef.current} />
      <Fist side="right" thrustT={thrustTRef.current} />

      {/* === UPWARD ARROWS === */}
      <ThrustArrows thrustT={thrustTRef.current} />
    </group>
  );
}

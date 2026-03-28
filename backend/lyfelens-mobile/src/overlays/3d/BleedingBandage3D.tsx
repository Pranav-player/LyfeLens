/**
 * BleedingBandage3D — React Three Fiber 3D bandage application
 * Shows a holographic bandage cloth being pressed onto the wound
 * by a 3D hand, anchored to the left_wrist keypoint.
 * Light coral + white palette for AR friendliness.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// The cloth/bandage mesh
function Bandage({ pressY }: { pressY: number }) {
  const meshRef = useRef<THREE.Group>(null);
  return (
    <group ref={meshRef} position={[0, pressY, 0]}>
      {/* Main cloth — slightly wrinkled look using multiple planes */}
      <mesh>
        <boxGeometry args={[70, 4, 45]} />
        <meshStandardMaterial
          color="#F9F5F0"
          roughness={0.8}
          metalness={0.0}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Cross-stitch patterns on bandage */}
      {[[-20, 0], [0, 0], [20, 0]].map(([x], i) => (
        <group key={i} position={[x as number, 3, 0]}>
          <mesh>
            <boxGeometry args={[8, 1, 30]} />
            <meshBasicMaterial color="#E8DDD8" transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[8, 1, 14]} />
            <meshBasicMaterial color="#E8DDD8" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Bandage edges (darker strips) */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[0, 0, side * 20]}>
          <boxGeometry args={[70, 5, 5]} />
          <meshStandardMaterial
            color="#DDD0C8"
            roughness={0.7}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3D pressing hand
function PressHand({ pressY }: { pressY: number }) {
  return (
    <group position={[0, pressY + 18, 0]}>
      {/* Palm */}
      <mesh>
        <boxGeometry args={[52, 12, 32]} />
        <meshStandardMaterial color="#e3bca5" roughness={0.6} />
      </mesh>

      {/* 4 Fingers */}
      {[-18, -6, 6, 18].map((x, i) => (
        <mesh key={i} position={[x, 0, -23]}>
          <cylinderGeometry args={[4, 3.5, 16, 8]} />
          <meshStandardMaterial color="#d2a68d" roughness={0.6} />
        </mesh>
      ))}

      {/* Thumb */}
      <mesh position={[30, 0, -8]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[4, 3.5, 13, 8]} />
        <meshStandardMaterial color="#d2a68d" roughness={0.6} />
      </mesh>

      {/* Knuckle bumps */}
      {[-18, -6, 6, 18].map((x, i) => (
        <mesh key={i} position={[x, 7, -8]}>
          <sphereGeometry args={[5, 8, 8]} />
          <meshStandardMaterial color="#e3bca5" roughness={0.5} />
        </mesh>
      ))}

      {/* Shadow cast by hand on bandage */}
      <mesh position={[0, -16, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.8, 1, 1]}>
        <circleGeometry args={[22, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Wound indicator pulsing
function WoundIndicator() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = (Math.sin(t * 2) + 1) / 2;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.2 + pulse * 0.2;
    ringRef.current.scale.set(1 + pulse * 0.2, 1, 1 + pulse * 0.2);
  });
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[35, 42, 48]} />
        <meshBasicMaterial color="#FF6B6B" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <circleGeometry args={[35, 48]} />
        <meshBasicMaterial color="#FFAAAA" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Press arrows pointing down
function PressArrows() {
  return (
    <group>
      {[-30, 0, 30].map((x, i) => (
        <group key={i} position={[x, 90, 0]}>
          {/* Arrow shaft */}
          <mesh>
            <cylinderGeometry args={[2.5, 2.5, 30, 8]} />
            <meshBasicMaterial color="#FF9977" transparent opacity={0.65} />
          </mesh>
          {/* Arrowhead */}
          <mesh position={[0, -22, 0]}>
            <coneGeometry args={[8, 14, 8]} />
            <meshBasicMaterial color="#FF7755" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

type BleedingBandage3DProps = {
  worldX: number;
  worldY: number;
};

export default function BleedingBandage3D({ worldX, worldY }: BleedingBandage3DProps) {
  const pressY = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Rhythmic pressing: press down (0.5s) → hold (0.3s) → release (0.4s)
    const beat = (t * 0.8) % 1;
    if (beat < 0.4) {
      pressY.current = -(beat / 0.4) * 18; // press down
    } else if (beat < 0.6) {
      pressY.current = -18; // hold
    } else {
      pressY.current = -18 + ((beat - 0.6) / 0.4) * 18; // release
    }
  });

  return (
    <group position={[worldX, worldY, 0]}>
      {/* === LIGHTS === */}
      <ambientLight intensity={1.1} color="#FFEEEE" />
      <pointLight position={[0, 200, -100]} intensity={1.4} color="#FFCCBB" />
      <pointLight position={[0, -100, 0]} intensity={0.7} color="#FFFFFF" />

      {/* === WOUND INDICATOR === */}
      <WoundIndicator />

      {/* === PRESS ARROWS === */}
      <PressArrows />

      {/* === BANDAGE CLOTH on wound === */}
      <Bandage pressY={pressY.current} />

      {/* === PRESSING HAND === */}
      <PressHand pressY={pressY.current} />
    </group>
  );
}

/**
 * CPRHands3D — Anatomically Correct 3D Human Hands for CPR
 * 
 * Features:
 * - Realistic multi-segment fingers (3 phalanges each) with knuckle joints
 * - Rounded palm using sphere geometry
 * - Properly positioned thumb with opposition angle
 * - Skin-tone materials with subsurface scattering approximation
 * - Interlocked CPR hand position (heel-of-palm technique)
 * - EMA smoothing for jitter-free tracking
 * - 100-120 BPM compression animation
 * - Live animated depth gauge
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// =============================================================================
// SKIN MATERIALS — realistic warm skin tones
// =============================================================================
const SKIN = {
  palm: '#E8B99A',      // warm peachy palm
  back: '#D4A07A',      // slightly darker dorsal
  finger: '#DBA88A',    // finger segments
  knuckle: '#C89878',   // darker at joints
  nail: '#F0C8B8',      // pinkish nails
};

// Reusable material — meshBasicMaterial works reliably on EXGL (expo-gl)
// meshStandardMaterial silently fails on Android's limited WebGL implementation
function SkinMat({ color }: { color: string; roughness?: number }) {
  return <meshBasicMaterial color={color} />;
}

// =============================================================================
// FINGER — 3 phalanges (proximal, middle, distal) + nail
// =============================================================================
function Finger({
  length = [12, 10, 8],     // lengths of 3 segments
  radius = [3.2, 2.8, 2.4], // radii tapered
  curl = [0, 0.15, 0.25],   // curl angles per segment (radians)
  position,
  rotation = [0, 0, 0],
}: {
  length?: number[];
  radius?: number[];
  curl?: number[];
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation as any}>
      {/* Proximal phalanx */}
      <group rotation={[curl[0], 0, 0]}>
        <mesh>
          <cylinderGeometry args={[radius[0], radius[0], length[0], 12]} />
          <SkinMat color={SKIN.finger} />
        </mesh>
        {/* Knuckle joint */}
        <mesh position={[0, -length[0] / 2 - radius[0] * 0.3, 0]}>
          <sphereGeometry args={[radius[0] * 1.1, 10, 10]} />
          <SkinMat color={SKIN.knuckle} roughness={0.65} />
        </mesh>

        {/* Middle phalanx */}
        <group position={[0, -length[0] - radius[0] * 0.4, 0]} rotation={[curl[1], 0, 0]}>
          <mesh>
            <cylinderGeometry args={[radius[1], radius[1], length[1], 12]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Joint */}
          <mesh position={[0, -length[1] / 2 - radius[1] * 0.3, 0]}>
            <sphereGeometry args={[radius[1] * 1.05, 8, 8]} />
            <SkinMat color={SKIN.knuckle} roughness={0.65} />
          </mesh>

          {/* Distal phalanx (fingertip) */}
          <group position={[0, -length[1] - radius[1] * 0.4, 0]} rotation={[curl[2], 0, 0]}>
            <mesh>
              <cylinderGeometry args={[radius[2], radius[2], length[2], 12]} />
              <SkinMat color={SKIN.finger} />
            </mesh>
            {/* Fingernail */}
            <mesh position={[0, -length[2] / 2, -radius[2] * 0.5]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[radius[2] * 1.4, radius[2] * 1.8, 0.8]} />
              <SkinMat color={SKIN.nail} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

// =============================================================================
// THUMB — shorter, thicker, with opposition angle
// =============================================================================
function Thumb({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation as any}>
      {/* Metacarpal */}
      <mesh>
        <cylinderGeometry args={[4, 4, 10, 12]} />
        <SkinMat color={SKIN.palm} />
      </mesh>
      {/* Proximal */}
      <group position={[0, -12, 0]} rotation={[0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[3.5, 3.5, 9, 12]} />
          <SkinMat color={SKIN.finger} />
        </mesh>
        {/* Distal */}
        <group position={[0, -10, 0]} rotation={[0.2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[3, 3, 7, 12]} />
            <SkinMat color={SKIN.finger} />
          </mesh>
          {/* Thumbnail */}
          <mesh position={[0, -4.5, -2.5]}>
            <boxGeometry args={[4.5, 5, 0.8]} />
            <SkinMat color={SKIN.nail} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// =============================================================================
// FULL HUMAN HAND — palm + 4 fingers + thumb + wrist
// =============================================================================
function RealisticHand({
  position,
  rotation = [0, 0, 0],
  mirror = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  mirror?: boolean;
}) {
  const s = mirror ? -1 : 1;

  // Finger specs: [lengths], [radii], [curl], xOffset from center
  const fingers = [
    { x: -15 * s, lengths: [11, 9, 7],  radii: [2.8, 2.4, 2.0], curl: [0, 0.15, 0.3] },   // Index
    { x: -5 * s,  lengths: [13, 11, 8], radii: [3.0, 2.6, 2.2], curl: [0, 0.12, 0.25] },  // Middle (longest)
    { x: 5 * s,   lengths: [12, 10, 7], radii: [2.9, 2.5, 2.1], curl: [0, 0.14, 0.28] },  // Ring
    { x: 14 * s,  lengths: [9, 8, 6],   radii: [2.5, 2.2, 1.8], curl: [0, 0.18, 0.35] },  // Pinky
  ];

  return (
    <group position={position} rotation={rotation as any}>
      {/* === PALM — rounded flattened sphere === */}
      <mesh scale={[1.0, 0.25, 0.7]}>
        <sphereGeometry args={[28, 16, 16]} />
        <SkinMat color={SKIN.palm} />
      </mesh>

      {/* Palm pad (heel of hand — the part that presses in CPR) */}
      <mesh position={[0, -2, 12]} scale={[0.8, 0.25, 0.45]}>
        <sphereGeometry args={[22, 12, 12]} />
        <SkinMat color={SKIN.palm} roughness={0.7} />
      </mesh>

      {/* === WRIST === */}
      <mesh position={[0, 0, 22]}>
        <cylinderGeometry args={[12, 12, 14, 12]} />
        <SkinMat color={SKIN.back} />
      </mesh>

      {/* === FOREARM stub === */}
      <mesh position={[0, 0, 38]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[10, 10, 20, 12]} />
        <SkinMat color={SKIN.back} roughness={0.6} />
      </mesh>

      {/* === 4 FINGERS === */}
      {fingers.map((f, i) => (
        <Finger
          key={i}
          position={[f.x, 0, -18]}
          length={f.lengths}
          radius={f.radii}
          curl={f.curl}
        />
      ))}

      {/* === THUMB === */}
      <Thumb
        position={[-24 * s, 0, 2]}
        rotation={[0.2, 0.5 * s, -0.6 * s]}
      />

      {/* === KNUCKLE RIDGE (across top of palm) === */}
      {fingers.map((f, i) => (
        <mesh key={`k${i}`} position={[f.x, 3, -16]}>
          <sphereGeometry args={[3.5, 8, 8]} />
          <SkinMat color={SKIN.knuckle} roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// TARGET CROSSHAIR — shows the correct sternum compression zone
// =============================================================================
function TargetCrosshair() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[70, 73, 64]} />
        <meshBasicMaterial color="#5BB8F5" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[50, 52, 64]} />
        <meshBasicMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[0, rot, 0]}>
          <boxGeometry args={[120, 2, 2]} />
          <meshBasicMaterial color="#5BB8F5" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// SHOCKWAVE RING — pulses outward on each compression
// =============================================================================
function ShockwaveRing({ phaseRef }: { phaseRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const phase = phaseRef.current;
    const s = 0.8 + phase * 2.5;
    meshRef.current.scale.set(s, 1, s);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 0.6 - phase * 0.6);
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[55, 60, 64]} />
      <meshBasicMaterial color="#5BB8F5" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

// =============================================================================
// LIVE DEPTH GAUGE — animated bar that tracks compression depth
// =============================================================================
function LiveDepthGauge({ pressTRef }: { pressTRef: React.MutableRefObject<number> }) {
  const fillRef = useRef<THREE.Mesh>(null);
  const colorRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!fillRef.current) return;
    const p = pressTRef.current;
    const fillH = 6 + p * 42;
    fillRef.current.scale.y = fillH / 48;
    fillRef.current.position.y = -50 + fillH / 2;
    if (colorRef.current) {
      colorRef.current.color.set(p > 0.5 ? '#00CC88' : '#5BB8F5');
    }
  });

  return (
    <group position={[110, 0, 0]}>
      <mesh>
        <boxGeometry args={[10, 100, 10]} />
        <meshBasicMaterial color="#B0D4F1" transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[18, 2.5, 10]} />
        <meshBasicMaterial color="#00C8FF" transparent opacity={0.9} />
      </mesh>
      {/* Fill bar */}
      <mesh ref={fillRef} position={[0, -50, 0]}>
        <boxGeometry args={[10, 48, 10]} />
        <meshBasicMaterial ref={colorRef as any} color="#5BB8F5" transparent opacity={0.8} />
      </mesh>
      {/* Label: 5-6cm optimal zone */}
      <mesh position={[0, 25, 8]}>
        <boxGeometry args={[3, 12, 0.5]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// =============================================================================
// MAIN COMPONENT — CPRHands3D
// =============================================================================
type CPRHands3DProps = {
  worldX: number;
  worldY: number;
};

export default function CPRHands3D({ worldX, worldY }: CPRHands3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const topHandRef = useRef<THREE.Group>(null);
  const bottomHandRef = useRef<THREE.Group>(null);
  const ringPhaseRef = useRef(0);
  const pressTRef = useRef(0);

  // EMA tracking state — jitter-free rendering
  const targetX = useRef(worldX);
  const targetY = useRef(worldY);

  useFrame(({ clock }) => {
    // 1. EMA Smoothing: prevX*0.7 + currentX*0.3
    targetX.current = targetX.current * 0.7 + worldX * 0.3;
    targetY.current = targetY.current * 0.7 + worldY * 0.3;

    if (groupRef.current) {
      groupRef.current.position.x = targetX.current;
      groupRef.current.position.y = targetY.current;
    }

    // 2. 100 BPM compression bounce (1.667 Hz)
    const t = clock.getElapsedTime();
    const beat = (t * 1.667) % 1;

    const pressT =
      beat < 0.4
        ? Math.sin((beat / 0.4) * Math.PI * 0.5)
        : Math.cos(((beat - 0.4) / 0.6) * Math.PI * 0.5);
    pressTRef.current = pressT;

    const pushY = -pressT * 28;

    if (topHandRef.current) {
      topHandRef.current.position.y = pushY;
    }
    if (bottomHandRef.current) {
      bottomHandRef.current.position.y = pushY - 10;
    }

    ringPhaseRef.current = beat < 0.4 ? beat / 0.4 : 0;
  });

  return (
    <group ref={groupRef} position={[worldX, worldY, 0]}>
      {/* === LIGHTING — use ambient only for basic material compatibility === */}
      <ambientLight intensity={2.0} color="#FFFFFF" />

      {/* === TARGET CROSSHAIR ON CHEST === */}
      <TargetCrosshair />

      {/* === SHOCKWAVE PULSE === */}
      <ShockwaveRing phaseRef={ringPhaseRef} />

      {/* === TOP HAND (dominant, pressing — palm down on chest) === */}
      <group ref={topHandRef} position={[0, 40, 0]}>
        <RealisticHand
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>

      {/* === BOTTOM HAND (interlocked, supporting — rotated 180°) === */}
      <group ref={bottomHandRef} position={[0, 50, 0]}>
        <RealisticHand
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
          mirror={true}
        />
      </group>

      {/* === ARM GUIDE LINES === */}
      <mesh position={[-40, 90, -100]} rotation={[0.5, 0.3, 0]}>
        <cylinderGeometry args={[3, 3, 160, 8]} />
        <SkinMat color={SKIN.back} roughness={0.6} />
      </mesh>
      <mesh position={[40, 90, -100]} rotation={[0.5, -0.3, 0]}>
        <cylinderGeometry args={[3, 3, 160, 8]} />
        <SkinMat color={SKIN.back} roughness={0.6} />
      </mesh>

      {/* === CHEST SHADOW === */}
      <mesh position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.8, 1, 1]}>
        <circleGeometry args={[30, 32]} />
        <meshBasicMaterial color="#5A3322" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* === LIVE DEPTH GAUGE === */}
      <LiveDepthGauge pressTRef={pressTRef} />
    </group>
  );
}

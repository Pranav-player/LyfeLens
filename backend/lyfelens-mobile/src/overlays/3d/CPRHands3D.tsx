/**
 * CPRHands3D — React Three Fiber 3D CPR hands
 * Sky-blue holographic hands that press down on the patient's chest
 * anchored to the MoveNet chest_midpoint keypoint.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// A single procedural "palm + fingers" hand mesh
function Hand3D({
  position,
  rotation = [0, 0, 0],
  color = '#5BB8F5',
  opacity = 0.88,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  const mat = (
    <meshStandardMaterial
      color={'#e3bca5'}
      roughness={0.6}
    />
  );
  const fingerColor = '#d2a68d';
  const fingerMat = (
    <meshStandardMaterial
      color={fingerColor}
      roughness={0.6}
    />
  );

  return (
    <group position={position} rotation={rotation as any}>
      {/* Palm — wide flat box */}
      <mesh>
        <boxGeometry args={[55, 10, 30]} />
        {mat}
      </mesh>

      {/* 4 Fingers */}
      {[-18, -6, 6, 18].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0, -22]}>
          <cylinderGeometry args={[4.5, 4, 18, 8]} />
          {fingerMat}
        </mesh>
      ))}

      {/* Thumb */}
      <mesh position={[32, 0, -8]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[4, 3.5, 15, 8]} />
        {fingerMat}
      </mesh>

      {/* Wrist / heel of hand — slightly wider at base */}
      <mesh position={[0, 0, 15]}>
        <boxGeometry args={[45, 12, 12]} />
        {mat}
      </mesh>
    </group>
  );
}

// Shockwave pulse ring
function ShockwaveRing({ phase }: { phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const s = 0.8 + phase * 2.5;
    meshRef.current.scale.set(s, 1, s);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 0.6 - phase * 0.6);
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[55, 60, 64]} />
      <meshBasicMaterial
        color="#5BB8F5"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Target zone cross-hairs on chest
function TargetCrosshair() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[70, 73, 64]} />
        <meshBasicMaterial color="#5BB8F5" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[50, 52, 64]} />
        <meshBasicMaterial color="#87CEEB" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Cross bars */}
      {[0, Math.PI / 2].map((rot, i) => (
        <mesh key={i} rotation={[0, rot, 0]}>
          <boxGeometry args={[120, 2, 2]} />
          <meshBasicMaterial color="#5BB8F5" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// Live depth gauge that reads from the parent's pressTRef
function LiveDepthGauge({ pressTRef }: { pressTRef: React.MutableRefObject<number> }) {
  const fillRef = useRef<THREE.Mesh>(null);
  const colorRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!fillRef.current) return;
    const p = pressTRef.current;
    const fillH = 6 + p * 42;
    fillRef.current.scale.y = fillH / 48;
    fillRef.current.position.y = -50 + fillH / 2;
    
    // Color changes: green when in optimal range, yellow otherwise
    if (colorRef.current) {
      colorRef.current.color.set(p > 0.5 ? '#00CC88' : '#5BB8F5');
    }
  });

  return (
    <group position={[100, 0, 0]}>
      {/* Background track */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[10, 100, 10]} />
        <meshBasicMaterial color="#B0D4F1" transparent opacity={0.15} />
      </mesh>
      {/* Optimal marker */}
      <mesh position={[0, 25, 0]}>
        <boxGeometry args={[18, 2.5, 10]} />
        <meshBasicMaterial color="#00C8FF" transparent opacity={0.9} />
      </mesh>
      {/* Animated fill */}
      <mesh ref={fillRef} position={[0, -50, 0]}>
        <boxGeometry args={[10, 48, 10]} />
        <meshStandardMaterial ref={colorRef as any} color="#5BB8F5" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

type CPRHands3DProps = {
  /** Chest keypoint converted to 3D world space (cx, 0, cy) */
  worldX: number;
  worldY: number;
};

export default function CPRHands3D({ worldX, worldY }: CPRHands3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const topHandRef = useRef<THREE.Group>(null);
  const bottomHandRef = useRef<THREE.Group>(null);
  const ringPhaseRef = useRef(0);

  const pressTRef = useRef(0);

  // EMA physics state for smooth AR tracking
  const targetX = useRef(worldX);
  const targetY = useRef(worldY);

  useFrame(({ clock }) => {
    // 1. EMA Smoothing: 0.7 * prev + 0.3 * current
    targetX.current = targetX.current * 0.7 + worldX * 0.3;
    targetY.current = targetY.current * 0.7 + worldY * 0.3;

    if (groupRef.current) {
      groupRef.current.position.x = targetX.current;
      groupRef.current.position.y = targetY.current;
    }

    // 2. 100-120 BPM simulated compression bounce
    const t = clock.getElapsedTime();
    const beat = (t * 1.667) % 1; 
    
    // Push: easeOut downward, Pull: easeIn upward
    const pressT =
      beat < 0.4
        ? Math.sin((beat / 0.4) * Math.PI * 0.5) 
        : Math.cos(((beat - 0.4) / 0.6) * Math.PI * 0.5); 
    pressTRef.current = pressT;

    const pushY = -pressT * 28; // max 28 units deep

    if (topHandRef.current) {
      topHandRef.current.position.y = pushY;
    }
    if (bottomHandRef.current) {
      bottomHandRef.current.position.y = pushY - 8;
    }

    // Shockwave phase driven by beat
    ringPhaseRef.current = beat < 0.4 ? beat / 0.4 : 0;
  });

  return (
    <group
      ref={groupRef}
      // Initial mount position, useFrame takes over after
      position={[worldX, worldY, 0]}
    >
      {/* === LIGHTS === */}
      <ambientLight intensity={1.2} color="#E8F4FF" />
      <pointLight position={[0, 200, -100]} intensity={1.5} color="#87CEEB" />
      <pointLight position={[0, -200, 100]} intensity={0.8} color="#FFFFFF" />

      {/* === TARGET ZONE === */}
      <TargetCrosshair />

      {/* === SHOCKWAVE === */}
      <ShockwaveRing phase={ringPhaseRef.current} />

      {/* === ARM GUIDE LINES === */}
      {/* Left arm line from above */}
      <mesh position={[-50, 80, -110]} rotation={[0.5, 0.3, 0]}>
        <cylinderGeometry args={[2, 2, 180, 8]} />
        <meshBasicMaterial color="#5BB8F5" transparent opacity={0.25} />
      </mesh>
      {/* Right arm line from above */}
      <mesh position={[50, 80, -110]} rotation={[0.5, -0.3, 0]}>
        <cylinderGeometry args={[2, 2, 180, 8]} />
        <meshBasicMaterial color="#5BB8F5" transparent opacity={0.25} />
      </mesh>

      {/* === TOP HAND (dominant, pressing) === */}
      <group ref={topHandRef} position={[0, 40, 0]}>
        <Hand3D
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color="#5BB8F5"
          opacity={0.9}
        />
      </group>

      {/* === BOTTOM HAND (interlocked) === */}
      <group ref={bottomHandRef} position={[0, 45, 0]}>
        <Hand3D
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
          color="#3AA3E8"
          opacity={0.8}
        />
      </group>

      {/* Shadow on chest surface */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.8, 1, 1]}>
        <circleGeometry args={[25, 32]} />
        <meshBasicMaterial color="#2288CC" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* === LIVE DEPTH GAUGE === */}
      <LiveDepthGauge pressTRef={pressTRef} />
    </group>
  );
}

import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// Glowing, spinning 3D medical cross inside a wireframe sphere
function GlowingCross({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.05;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        }
        if (materialRef.current) {
            materialRef.current.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.5;
        }
    });

    return (
        <group ref={meshRef} position={position}>
            {/* Vertical bar */}
            <mesh castShadow>
                <boxGeometry args={[0.4, 1.2, 0.4]} />
                <meshStandardMaterial
                    ref={materialRef}
                    color="#ff3333"
                    emissive="#ff0000"
                    emissiveIntensity={1}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            {/* Horizontal bar */}
            <mesh castShadow>
                <boxGeometry args={[1.2, 0.4, 0.4]} />
                <meshStandardMaterial
                    color="#ff3333"
                    emissive="#ff0000"
                    emissiveIntensity={1}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            {/* Wireframe sphere HUD */}
            <mesh>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.2} />
            </mesh>
        </group>
    );
}

export default function MedicalHologram({
    x, y, conditionCode
}: {
    x: number, y: number, conditionCode: string
}) {
    // x and y are normalized 0-1 from MoveNet
    const mappedX = (x * 10) - 5;
    const mappedY = -((y * 10) - 5);

    if (conditionCode === 'NONE') return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00ffff" />
                <GlowingCross position={[mappedX, mappedY, 0]} />
            </Canvas>
        </View>
    );
}

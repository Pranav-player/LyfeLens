/**
 * HoloScene3D — Main React Three Fiber Canvas wrapper
 * Transparent absolute overlay on top of CameraView.
 * Orthographic camera = MoveNet pixels map 1:1 to 3D world space.
 */

import React from 'react';
import { Dimensions } from 'react-native';
import { Canvas } from '@react-three/fiber/native';

import CPRHands3D from './CPRHands3D';
import BurnWater3D from './BurnWater3D';
import BleedingBandage3D from './BleedingBandage3D';
import ChokingFists3D from './ChokingFists3D';

const { width: W, height: H } = Dimensions.get('window');

export function toWorld(kp: { x: number; y: number }) {
  return {
    worldX: (kp.x - 0.5) * W,
    worldY: -(kp.y - 0.5) * H,
  };
}

type Props = {
  overlayType: string;
  keypoints: { name: string; x: number; y: number }[];
};

function findKp(keypoints: { name: string; x: number; y: number }[], name: string) {
  return keypoints.find(k => k.name === name) || { x: 0.5, y: 0.42 };
}

function Scene({ overlayType, keypoints }: Props) {
  switch (overlayType) {
    case 'CARDIAC_ARREST': {
      const { worldX, worldY } = toWorld(findKp(keypoints, 'chest_midpoint'));
      return <CPRHands3D worldX={worldX} worldY={worldY} />;
    }
    case 'BURNS': {
      const { worldX, worldY } = toWorld(findKp(keypoints, 'left_wrist'));
      return <BurnWater3D worldX={worldX} worldY={worldY} />;
    }
    case 'BLEEDING': {
      const { worldX, worldY } = toWorld(findKp(keypoints, 'left_wrist'));
      return <BleedingBandage3D worldX={worldX} worldY={worldY} />;
    }
    case 'CHOKING': {
      const { worldX, worldY } = toWorld(findKp(keypoints, 'hip_midpoint'));
      return <ChokingFists3D worldX={worldX} worldY={worldY} />;
    }
    default:
      return null;
  }
}

export default function HoloScene3D({ overlayType, keypoints }: Props) {
  const has3D = ['CARDIAC_ARREST', 'BURNS', 'BLEEDING', 'CHOKING'].includes(overlayType);
  if (!has3D) return null;

  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }}
      gl={{ alpha: true, antialias: true }}
      camera={{
        type: 'OrthographicCamera',
        left: -W / 2,
        right: W / 2,
        top: H / 2,
        bottom: -H / 2,
        near: 0.1,
        far: 2000,
        position: [0, 0, 600],
      } as any}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Scene overlayType={overlayType} keypoints={keypoints} />
    </Canvas>
  );
}

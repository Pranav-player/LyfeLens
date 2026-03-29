/**
 * HoloScene3D — React Three Fiber Canvas with error boundary.
 * Renders 3D holographic overlays on top of the camera feed.
 * Uses proper zIndex/elevation for Android rendering order.
 */

import React from 'react';
import { Dimensions, View, Platform } from 'react-native';
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

function findKp(keypoints: { name: string; x: number; y: number }[], name: string, fallback = { x: 0.5, y: 0.42 }) {
  return keypoints.find(k => k.name === name) || fallback;
}

// For CARDIAC_ARREST: try sternum → chest_midpoint → nose → screen center
function findChestKp(keypoints: { name: string; x: number; y: number }[]) {
  return (
    keypoints.find(k => k.name === 'sternum') ||
    keypoints.find(k => k.name === 'chest_midpoint') ||
    keypoints.find(k => k.name === 'nose') ||
    { x: 0.5, y: 0.42 }
  );
}

function Scene({ overlayType, keypoints }: Props) {
  switch (overlayType) {
    case 'CARDIAC_ARREST': {
      // Try sternum → chest_midpoint → nose → center as fallbacks
      const { worldX, worldY } = toWorld(findChestKp(keypoints));
      return <CPRHands3D worldX={worldX} worldY={worldY} />;
    }
    case 'BURNS':
    case 'BURNS_FIRST_DEGREE':
    case 'BURNS_SECOND_DEGREE':
    case 'BURNS_THIRD_DEGREE': {
      const { worldX, worldY } = toWorld(findKp(keypoints, 'left_wrist'));
      return <BurnWater3D worldX={worldX} worldY={worldY} />;
    }
    case 'BLEEDING':
    case 'MINOR_CUT':
    case 'MAJOR_CUT':
    case 'MINOR_BLEEDING':
    case 'SEVERE_BLEEDING': {
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

// Error boundary — if Canvas/GL crashes, falls back to null (SVG takes over)
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; overlayType: string },
  { hasError: boolean; lastType: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, lastType: props.overlayType };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  // Reset the error boundary when the overlay type changes so it can retry
  static getDerivedStateFromProps(props: any, state: any) {
    if (props.overlayType !== state.lastType) {
      return { hasError: false, lastType: props.overlayType };
    }
    return null;
  }
  componentDidCatch(error: Error) {
    console.log('[HoloScene3D] ❌ Canvas crashed:', error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function HoloScene3D({ overlayType, keypoints }: Props) {
  const has3D = ['CARDIAC_ARREST', 'BURNS', 'BURNS_FIRST_DEGREE', 'BURNS_SECOND_DEGREE', 'BURNS_THIRD_DEGREE', 'BLEEDING', 'MINOR_CUT', 'MAJOR_CUT', 'MINOR_BLEEDING', 'SEVERE_BLEEDING', 'CHOKING'].includes(overlayType);
  if (!has3D) return null;

  console.log(`[HoloScene3D] Rendering: ${overlayType}`);

  return (
    <CanvasErrorBoundary overlayType={overlayType}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: H,
          zIndex: 50,
          elevation: 50,
          backgroundColor: 'transparent',
        }}
      >
        <Canvas
          style={{ flex: 1, backgroundColor: 'transparent' }}
          gl={{ alpha: true, antialias: false, premultipliedAlpha: false }}
          frameloop="always"
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
          onCreated={({ gl }) => {
            console.log('[HoloScene3D] ✅ GL context created');
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Scene overlayType={overlayType} keypoints={keypoints} />
        </Canvas>
      </View>
    </CanvasErrorBoundary>
  );
}

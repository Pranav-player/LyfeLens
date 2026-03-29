import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { 
  Circle, Ellipse, Line, Rect, Text as SvgText, 
  Path, Defs, LinearGradient, Stop, RadialGradient, G 
} from 'react-native-svg';
import Animated, { 
  useSharedValue, withRepeat, withSequence, withTiming, 
  useAnimatedProps, Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

type Props = { keypoint: { x: number, y: number }, beatActive?: boolean };

export default function CPROverlay({ keypoint, beatActive }: Props) {
  const cx = keypoint.x * width;
  const cy = keypoint.y * height;
  
  const [compressionCount, setCompressionCount] = useState(0);
  const phase = compressionCount < 30 ? 'COMPRESS' : 'BREATHE';
  const BEAT = 275;

  const pushDepth = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(1);
  const glowPulse = useSharedValue(0.3);

  useEffect(() => {
    if (!beatActive) {
      // Not started yet — show static overlay, no animation
      pushDepth.value = 0;
      setCompressionCount(0);
      return;
    }

    // Beat is active — start animations synced at 545ms (110 BPM)
    const interval = setInterval(() => {
      setCompressionCount(c => c >= 32 ? 0 : c + 1);
    }, 545);

    pushDepth.value = withRepeat(
      withSequence(
        withTiming(24, { duration: BEAT, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: BEAT, easing: Easing.in(Easing.quad) })
      ), -1, false
    );

    ringScale.value = withRepeat(withTiming(5, { duration: BEAT * 2 }), -1, false);
    ringOpacity.value = withRepeat(withTiming(0, { duration: BEAT * 2 }), -1, false);
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: BEAT }),
        withTiming(0.3, { duration: BEAT })
      ), -1, false
    );

    return () => clearInterval(interval);
  }, [beatActive]);

  // 3D-like hands pressing down
  const rightHandProps = useAnimatedProps(() => ({
    cy: cy - 5 + pushDepth.value,
  }));
  const leftHandProps = useAnimatedProps(() => ({
    cy: cy + 5 + pushDepth.value,
  }));
  const shadowProps = useAnimatedProps(() => ({
    cy: cy + 25 + pushDepth.value * 0.3,
    rx: 38 + pushDepth.value * 0.5,
    ry: 12 + pushDepth.value * 0.3,
  }));

  const shockwaveProps = useAnimatedProps(() => ({
    r: 30 * ringScale.value,
    opacity: ringOpacity.value,
  }));

  const depthFillProps = useAnimatedProps(() => ({
    height: pushDepth.value * 3.5,
    y: cy - 35 - (pushDepth.value * 3.5),
  }));

  const glowProps = useAnimatedProps(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        {/* 3D hand gradient — skin tone with depth */}
        <LinearGradient id="handGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#00FFaa" stopOpacity="0.95" />
          <Stop offset="0.5" stopColor="#00CC77" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#009955" stopOpacity="0.85" />
        </LinearGradient>
        
        {/* Depth gauge gradient */}
        <LinearGradient id="depthGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#00FF88" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#00FFCC" stopOpacity="0.8" />
          <Stop offset="1" stopColor="#44FFDD" stopOpacity="0.6" />
        </LinearGradient>

        {/* Target zone glow */}
        <RadialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#00FF88" stopOpacity="0.15" />
          <Stop offset="0.7" stopColor="#00FF88" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#00FF88" stopOpacity="0" />
        </RadialGradient>

        {/* Glass panel */}
        <LinearGradient id="glassPanel" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(255,255,255,0.15)" />
          <Stop offset="1" stopColor="rgba(0,0,0,0.6)" />
        </LinearGradient>
      </Defs>

      {/* === HOLOGRAPHIC TARGET ZONE === */}
      <AnimatedCircle cx={cx} cy={cy} r={100} fill="url(#targetGlow)" animatedProps={glowProps} />
      
      {/* Outer targeting ring — holographic */}
      <Circle cx={cx} cy={cy} r={75} 
        stroke="#00FF88" strokeWidth={1.5} strokeDasharray="12 4 4 4"
        fill="none" opacity={0.6} />
      <Circle cx={cx} cy={cy} r={55}
        stroke="#00FFCC" strokeWidth={1} strokeDasharray="6 6"
        fill="none" opacity={0.4} />
      
      {/* Crosshair — exact press point */}
      <Line x1={cx - 15} y1={cy} x2={cx - 5} y2={cy} stroke="#00FF88" strokeWidth={2.5} />
      <Line x1={cx + 5} y1={cy} x2={cx + 15} y2={cy} stroke="#00FF88" strokeWidth={2.5} />
      <Line x1={cx} y1={cy - 15} x2={cx} y2={cy - 5} stroke="#00FF88" strokeWidth={2.5} />
      <Line x1={cx} y1={cy + 5} x2={cx} y2={cy + 15} stroke="#00FF88" strokeWidth={2.5} />
      <Circle cx={cx} cy={cy} r={3} fill="#00FF88" />

      {/* Shockwave pulse */}
      <AnimatedCircle cx={cx} cy={cy} stroke="#00FF88" strokeWidth={2.5} fill="none" animatedProps={shockwaveProps} />

      {/* === ARM GUIDE LINES — locked elbows === */}
      <Line x1={cx - 60} y1={cy - 160} x2={cx - 18} y2={cy - 10} 
        stroke="#00FF88" strokeWidth={2.5} strokeDasharray="8 4" opacity={0.5} />
      <Line x1={cx + 60} y1={cy - 160} x2={cx + 18} y2={cy - 10} 
        stroke="#00FF88" strokeWidth={2.5} strokeDasharray="8 4" opacity={0.5} />
      
      {/* Elbow lock indicators */}
      <Circle cx={cx - 38} cy={cy - 85} r={5} stroke="#00FF88" strokeWidth={1.5} fill="rgba(0,255,136,0.3)" />
      <Circle cx={cx + 38} cy={cy - 85} r={5} stroke="#00FF88" strokeWidth={1.5} fill="rgba(0,255,136,0.3)" />

      {/* === 3D HAND — shadow underneath === */}
      <AnimatedEllipse cx={cx} fill="rgba(0,0,0,0.4)" animatedProps={shadowProps} />

      {/* === 3D RIGHT HAND (top) — detailed with fingers === */}
      {/* Palm */}
      <AnimatedEllipse cx={cx + 5} rx={32} ry={16} 
        fill="url(#handGrad)" stroke="#00FFCC" strokeWidth={2.5}
        animatedProps={rightHandProps} />
      {/* Finger bumps */}
      <AnimatedEllipse cx={cx - 20} rx={6} ry={8}
        fill="rgba(0,200,100,0.7)" animatedProps={rightHandProps} />
      <AnimatedEllipse cx={cx - 8} rx={6} ry={9}
        fill="rgba(0,200,100,0.7)" animatedProps={rightHandProps} />
      <AnimatedEllipse cx={cx + 5} rx={6} ry={9}
        fill="rgba(0,200,100,0.7)" animatedProps={rightHandProps} />
      <AnimatedEllipse cx={cx + 18} rx={6} ry={8}
        fill="rgba(0,200,100,0.7)" animatedProps={rightHandProps} />

      {/* === 3D LEFT HAND (bottom) — interlocked === */}
      <AnimatedEllipse cx={cx - 5} rx={30} ry={14}
        fill="rgba(0,180,100,0.75)" stroke="#00CC88" strokeWidth={2}
        animatedProps={leftHandProps} />

      {/* Thumb wrapped around */}
      <AnimatedEllipse cx={cx + 28} rx={8} ry={6}
        fill="rgba(0,220,120,0.8)" stroke="#00CC88" strokeWidth={1}
        animatedProps={leftHandProps} />

      {/* === LOCK ELBOWS — glass panel === */}
      <Rect x={cx - 58} y={cy - 180} width={116} height={28} rx={10} fill="rgba(0,0,0,0.75)" stroke="#00FF88" strokeWidth={1.5} />
      <SvgText x={cx} y={cy - 162} textAnchor="middle" fill="#00FF88" fontSize={12} fontWeight="bold" fontFamily="Courier">
        🔒 LOCK ELBOWS
      </SvgText>

      {/* === PRESS HERE — prominent === */}
      <Rect x={cx - 55} y={cy + 35} width={110} height={26} rx={10} fill="rgba(0,255,136,0.95)" />
      <SvgText x={cx} y={cy + 52} textAnchor="middle" fill="#000" fontSize={13} fontWeight="900" fontFamily="Courier">
        ▼ PRESS HERE
      </SvgText>

      {/* === DEPTH GAUGE — 3D look === */}
      <Rect x={cx + 90} y={cy - 70} width={10} height={140} rx={5} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      {/* Optimal zone marker */}
      <Rect x={cx + 85} y={cy - 35} width={20} height={2} fill="#00FF88" />
      <SvgText x={cx + 115} y={cy - 30} fill="#00FF88" fontSize={8} fontFamily="Courier" fontWeight="bold">5cm</SvgText>
      <SvgText x={cx + 115} y={cy - 20} fill="#00FF88" fontSize={7} fontFamily="Courier">OPTIMAL</SvgText>
      {/* Too shallow marker */}
      <Rect x={cx + 85} y={cy + 30} width={20} height={2} fill="#FF4444" />
      <SvgText x={cx + 115} y={cy + 34} fill="#FF4444" fontSize={7} fontFamily="Courier">SHALLOW</SvgText>
      {/* Animated fill */}
      <AnimatedRect x={cx + 90} width={10} rx={5} fill="url(#depthGrad)" animatedProps={depthFillProps} />

      {/* === BPM + PHASE — glass panel === */}
      <Rect x={cx - 72} y={cy + 68} width={144} height={42} rx={12} 
        fill="rgba(0,0,0,0.8)" stroke={phase === 'COMPRESS' ? '#00FF88' : '#44AAFF'} strokeWidth={1.5} />
      <SvgText x={cx} y={cy + 85} textAnchor="middle" 
        fill={phase === 'COMPRESS' ? '#00FF88' : '#44AAFF'} fontSize={14} fontWeight="900" fontFamily="Courier">
        {phase === 'COMPRESS' ? `⬇ PUSH ${Math.min(compressionCount, 30)}/30` : '💨 2 BREATHS'}
      </SvgText>
      <SvgText x={cx} y={cy + 103} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="Courier">
        ♥ 100 BPM RHYTHM
      </SvgText>
    </Svg>
  );
}

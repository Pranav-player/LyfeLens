import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Rect, Text as SvgText, Polygon } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming, 
  useAnimatedProps, 
  Easing 
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedLine = Animated.createAnimatedComponent(Line);

type Props = { keypoint: { x: number, y: number } };

export default function CPROverlay({ keypoint }: Props) {
  const cx = keypoint.x * width;
  const cy = keypoint.y * height;

  // 100 BPM = 600ms per beat (300ms down, 300ms up)
  const BEAT_DURATION = 300;

  // Hand pressing down animation
  const pushDepth = useSharedValue(0);
  const shadowSquish = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(1);

  useEffect(() => {
    // Rhythmic pressing inward
    pushDepth.value = withRepeat(
      withSequence(
        withTiming(20, { duration: BEAT_DURATION, easing: Easing.out(Easing.quad) }), // Push down
        withTiming(0, { duration: BEAT_DURATION, easing: Easing.in(Easing.quad) })    // Release fully
      ),
      -1, false
    );

    // Shadow squishes as hands press down
    shadowSquish.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: BEAT_DURATION, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: BEAT_DURATION, easing: Easing.in(Easing.quad) })
      ),
      -1, false
    );

    // Expanding shockwave ring showing 100 BPM rhythm
    ringScale.value = withRepeat(
      withTiming(4, { duration: BEAT_DURATION * 2 }),
      -1, false
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: BEAT_DURATION * 2 })
      ),
      -1, false
    );
  }, []);

  const handLeftProps = useAnimatedProps(() => ({
    cy: cy + pushDepth.value, // moves down
    rx: 28 + (pushDepth.value / 3), // gets slightly wider on press
  }));

  const handRightProps = useAnimatedProps(() => ({
    cy: cy + pushDepth.value,
    rx: 28 + (pushDepth.value / 3),
  }));

  const shadowProps = useAnimatedProps(() => ({
    rx: 35 * shadowSquish.value,
    ry: 15 * shadowSquish.value,
    opacity: 1 / shadowSquish.value,
  }));

  const shockwaveProps = useAnimatedProps(() => ({
    r: 30 * ringScale.value,
    opacity: ringOpacity.value,
  }));

  // Bar indicating depth
  const depthBarProps = useAnimatedProps(() => ({
    height: pushDepth.value * 2.5, // visual amplification
    y: cy - 20 - (pushDepth.value * 2.5),
  }));

  return (
    <Svg style={StyleSheet.absoluteFill}>
       {/* Target zone indicator */}
       <Circle cx={cx} cy={cy} r={65} stroke="#00FF88" strokeWidth={2} strokeDasharray="8 4" fill="rgba(0, 255, 136, 0.05)" />
       
       {/* Shockwave originating from chest */}
       <AnimatedCircle cx={cx} cy={cy} stroke="#00FF88" strokeWidth={3} fill="none" animatedProps={shockwaveProps} />

       {/* Depth gauge slider on the right */}
       <Rect x={cx + 80} y={cy - 50} width={8} height={100} rx={4} fill="rgba(255, 255, 255, 0.2)" />
       <Rect x={cx + 70} y={cy - 10} width={15} height={2} fill="#00FF88" />
       <SvgText x={cx + 95} y={cy - 6} fill="#00FF88" fontSize={10} fontFamily="Courier">2" DEPTH</SvgText>
       
       {/* Animated fluid inside the gauge */}
       <AnimatedRect x={cx + 80} width={8} rx={4} fill="#00FF88" animatedProps={depthBarProps} />

       {/* Bottom shadow base */}
       <AnimatedEllipse cx={cx} cy={cy + 15} fill="rgba(0, 0, 0, 0.5)" animatedProps={shadowProps} />

       {/* Visual guides for locked elbows pointing downward */}
       <Line x1={cx - 50} y1={cy - 120} x2={cx - 15} y2={cy} stroke="#00FF88" strokeWidth={2} strokeDasharray="5 5" opacity={0.6} />
       <Line x1={cx + 50} y1={cy - 120} x2={cx + 15} y2={cy} stroke="#00FF88" strokeWidth={2} strokeDasharray="5 5" opacity={0.6} />
       
       {/* Top Hand (Right Hand) */}
       <AnimatedEllipse cx={cx + 8} cy={cy} rx={28} ry={14} fill="rgba(0, 255, 136, 0.9)" stroke="#fff" strokeWidth={2} animatedProps={handRightProps} />
       
       {/* Bottom Hand (Left Hand) */}
       <AnimatedEllipse cx={cx - 8} cy={cy} rx={28} ry={14} fill="rgba(0, 255, 136, 0.7)" stroke="#fff" strokeWidth={1.5} animatedProps={handLeftProps} />
       
       {/* Locked elbows text */}
       <Rect x={cx - 60} y={cy - 140} width={120} height={22} rx={6} fill="rgba(0, 0, 0, 0.7)" stroke="#00FF88" strokeWidth={1} />
       <SvgText x={cx} y={cy - 125} textAnchor="middle" fill="#00FF88" fontSize={12} fontWeight="bold" fontFamily="Courier">
         LOCK ELBOWS
       </SvgText>

       {/* Rate metronome counter */}
       <Rect x={cx - 45} y={cy + 60} width={90} height={26} rx={8} fill="rgba(0, 0, 0, 0.8)" stroke="#00FF88" strokeWidth={1.5} />
       <SvgText x={cx} y={cy + 77} textAnchor="middle" fill="#00FF88" fontSize={14} fontWeight="900" fontFamily="Courier">
         100 BPM
       </SvgText>
    </Svg>
  );
}

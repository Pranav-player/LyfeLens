import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { 
  Circle, Ellipse, Line, Polygon, Rect, Text as SvgText, 
  Path, Defs, LinearGradient, Stop, RadialGradient 
} from 'react-native-svg'
import Animated, { 
  useSharedValue, withRepeat, withSequence, withTiming, 
  useAnimatedProps, Easing 
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)
const AnimatedRect = Animated.createAnimatedComponent(Rect)

type Props = { keypoint: { x: number, y: number } }

export default function BleedingOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    const pressRadius = useSharedValue(35)
    const pressOpacity = useSharedValue(0.8)
    const handPush = useSharedValue(0)
    const glowPulse = useSharedValue(0.2)
    const dropY = useSharedValue(0)

    useEffect(() => {
        pressRadius.value = withRepeat(withTiming(55, { duration: 900 }), -1, true)
        pressOpacity.value = withRepeat(withTiming(0.15, { duration: 900 }), -1, true)
        
        handPush.value = withRepeat(
            withSequence(
                withTiming(10, { duration: 500, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })
            ), -1, false
        )

        glowPulse.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 600 }),
                withTiming(0.2, { duration: 600 })
            ), -1, false
        )

        // Blood drop animation
        dropY.value = withRepeat(
            withSequence(
                withTiming(40, { duration: 800, easing: Easing.in(Easing.quad) }),
                withTiming(0, { duration: 0 })
            ), -1, false
        )
    }, [])

    const pulseProps = useAnimatedProps(() => ({
        r: pressRadius.value,
        opacity: pressOpacity.value,
    }))

    const handProps = useAnimatedProps(() => ({
        cy: cy - 18 + handPush.value,
    }))

    const handShadowProps = useAnimatedProps(() => ({
        cy: cy + 22 + handPush.value * 0.3,
        rx: 34 + handPush.value * 0.4,
    }))

    const glowProps = useAnimatedProps(() => ({
        opacity: glowPulse.value,
    }))

    // Blood drops
    const drop1Props = useAnimatedProps(() => ({
        cy: cy + 55 + dropY.value,
        opacity: 1 - (dropY.value / 40),
    }))
    const drop2Props = useAnimatedProps(() => ({
        cy: cy + 60 + dropY.value * 0.7,
        opacity: 1 - (dropY.value * 0.7 / 40),
    }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            <Defs>
                <RadialGradient id="woundGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FF0000" stopOpacity="0.25" />
                    <Stop offset="0.6" stopColor="#FF0000" stopOpacity="0.08" />
                    <Stop offset="1" stopColor="#FF0000" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="pressHandGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FF6666" stopOpacity="0.95" />
                    <Stop offset="0.5" stopColor="#FF4444" stopOpacity="0.9" />
                    <Stop offset="1" stopColor="#CC2222" stopOpacity="0.85" />
                </LinearGradient>
                <LinearGradient id="clothGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" />
                    <Stop offset="1" stopColor="#DDDDDD" stopOpacity="0.6" />
                </LinearGradient>
            </Defs>

            {/* === WOUND GLOW ZONE === */}
            <AnimatedCircle cx={cx} cy={cy} r={90} fill="url(#woundGlow)" animatedProps={glowProps} />

            {/* Wound detection rings */}
            <Circle cx={cx} cy={cy} r={45}
                stroke="#FF2222" strokeWidth={2.5}
                fill="none" strokeDasharray="10 5" />
            <Circle cx={cx} cy={cy} r={30}
                stroke="#FF4444" strokeWidth={1.5}
                fill="rgba(255,0,0,0.1)" />
            
            {/* Pulse warning ring */}
            <AnimatedCircle cx={cx} cy={cy}
                stroke="#FF2222" strokeWidth={2}
                fill="none" animatedProps={pulseProps} />

            {/* Wound center — blood pool */}
            <Circle cx={cx} cy={cy} r={12}
                fill="rgba(180,0,0,0.6)"
                stroke="#FF2222" strokeWidth={2} />
            <Circle cx={cx - 3} cy={cy - 2} r={4}
                fill="rgba(255,50,50,0.8)" />

            {/* === BLOOD DROPS falling === */}
            <AnimatedCircle cx={cx - 8} r={4} fill="#CC0000" animatedProps={drop1Props} />
            <AnimatedCircle cx={cx + 6} r={3} fill="#DD2222" animatedProps={drop2Props} />

            {/* === 3D PRESSING HAND with cloth === */}
            {/* Shadow under hand */}
            <AnimatedEllipse cx={cx} ry={8} fill="rgba(0,0,0,0.35)" animatedProps={handShadowProps} />

            {/* Cloth/bandage */}
            <AnimatedEllipse cx={cx} rx={36} ry={14}
                fill="url(#clothGrad)" stroke="#CCCCCC" strokeWidth={1}
                animatedProps={handProps} />

            {/* Hand on top of cloth */}
            <AnimatedEllipse cx={cx} rx={30} ry={12}
                fill="url(#pressHandGrad)" stroke="#FF6666" strokeWidth={2.5}
                animatedProps={handProps} />
            
            {/* Finger bumps */}
            <AnimatedEllipse cx={cx - 18} rx={6} ry={7}
                fill="rgba(200,60,60,0.7)" animatedProps={handProps} />
            <AnimatedEllipse cx={cx - 6} rx={6} ry={8}
                fill="rgba(200,60,60,0.7)" animatedProps={handProps} />
            <AnimatedEllipse cx={cx + 6} rx={6} ry={8}
                fill="rgba(200,60,60,0.7)" animatedProps={handProps} />
            <AnimatedEllipse cx={cx + 18} rx={6} ry={7}
                fill="rgba(200,60,60,0.7)" animatedProps={handProps} />

            {/* Pressure arrow */}
            <Line x1={cx} y1={cy - 80} x2={cx} y2={cy - 50}
                stroke="#FF4444" strokeWidth={4} strokeLinecap="round" />
            <Polygon points={`${cx},${cy - 40} ${cx - 12},${cy - 56} ${cx + 12},${cy - 56}`}
                fill="#FF4444" />

            {/* === PRESS HARD NOW — glass panel === */}
            <Rect x={cx - 65} y={cy - 110} width={130} height={28} rx={10} 
                fill="rgba(255,0,0,0.9)" />
            <Rect x={cx - 65} y={cy - 110} width={130} height={14} rx={10} 
                fill="rgba(255,255,255,0.15)" />
            <SvgText x={cx} y={cy - 92} textAnchor="middle"
                fill="#fff" fontSize={13} fontWeight="900" fontFamily="Courier">
                ⬇ PRESS HARD NOW
            </SvgText>

            {/* === DO NOT LIFT — warning panel === */}
            <Rect x={cx - 62} y={cy + 48} width={124} height={24} rx={8} 
                fill="rgba(0,0,0,0.85)" stroke="#FF8800" strokeWidth={1.5} />
            <SvgText x={cx} y={cy + 64} textAnchor="middle"
                fill="#FF8800" fontSize={10} fontWeight="bold" fontFamily="Courier">
                ⚠ DO NOT LIFT — ADD MORE
            </SvgText>

            {/* === CLEAN CLOTH tip === */}
            <Rect x={cx - 55} y={cy + 78} width={110} height={22} rx={8} 
                fill="rgba(0,0,0,0.7)" stroke="#FFCC00" strokeWidth={1} />
            <SvgText x={cx} y={cy + 93} textAnchor="middle"
                fill="#FFCC00" fontSize={9} fontFamily="Courier">
                🧤 USE CLEAN CLOTH ONLY
            </SvgText>

            {/* === ELEVATE arrow === */}
            <Line x1={cx + 80} y1={cy + 15} x2={cx + 80} y2={cy - 50}
                stroke="#44AAFF" strokeWidth={2.5} strokeLinecap="round" />
            <Polygon points={`${cx + 80},${cy - 58} ${cx + 72},${cy - 44} ${cx + 88},${cy - 44}`}
                fill="#44AAFF" />
            <SvgText x={cx + 80} y={cy + 30} textAnchor="middle"
                fill="#44AAFF" fontSize={8} fontWeight="bold" fontFamily="Courier">
                RAISE UP
            </SvgText>

            {/* === TOURNIQUET line === */}
            <Line x1={cx - 60} y1={cy - 130} x2={cx + 60} y2={cy - 130}
                stroke="#FF8800" strokeWidth={3.5} strokeLinecap="round" strokeDasharray="10 5" />
            <Rect x={cx - 50} y={cy - 150} width={100} height={18} rx={6} fill="rgba(255,136,0,0.85)" />
            <SvgText x={cx} y={cy - 137} textAnchor="middle"
                fill="#fff" fontSize={9} fontWeight="bold" fontFamily="Courier">
                TIE TIGHT IF SEVERE
            </SvgText>
        </Svg>
    )
}
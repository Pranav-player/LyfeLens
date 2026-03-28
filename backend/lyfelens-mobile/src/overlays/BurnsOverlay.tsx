import React, { useEffect, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { 
  Circle, Line, Path, Rect, Text as SvgText, Ellipse,
  Defs, LinearGradient, Stop, RadialGradient 
} from 'react-native-svg'
import Animated, {
    useSharedValue, withRepeat, withSequence, withTiming, useAnimatedProps, Easing
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedPath = Animated.createAnimatedComponent(Path)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)

type Props = { keypoint: { x: number, y: number } }

export default function BurnsOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    const [seconds, setSeconds] = useState(0)
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    const remaining = Math.max(0, 600 - seconds)
    const remMins = Math.floor(remaining / 60)
    const remSecs = remaining % 60
    const progress = Math.min(seconds / 600, 1) // 0 to 1 over 10 min
    const timerColor = remaining > 300 ? '#44AAFF' : remaining > 60 ? '#FFCC00' : '#FF4444'

    const waterFlow = useSharedValue(0)
    const dropY1 = useSharedValue(0)
    const dropY2 = useSharedValue(0)
    const heatPulse = useSharedValue(0.15)

    useEffect(() => {
        waterFlow.value = withRepeat(withTiming(28, { duration: 600 }), -1, false)
        
        dropY1.value = withRepeat(
            withSequence(
                withTiming(60, { duration: 700, easing: Easing.in(Easing.quad) }),
                withTiming(0, { duration: 0 })
            ), -1, false
        )
        dropY2.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 200 }),
                withTiming(50, { duration: 600, easing: Easing.in(Easing.quad) }),
                withTiming(0, { duration: 0 })
            ), -1, false
        )

        heatPulse.value = withRepeat(
            withSequence(
                withTiming(0.35, { duration: 800 }),
                withTiming(0.15, { duration: 800 })
            ), -1, false
        )
    }, [])

    const waterProps = useAnimatedProps(() => ({
        strokeDashoffset: -waterFlow.value,
    }))
    const heatProps = useAnimatedProps(() => ({
        opacity: heatPulse.value,
    }))
    const drop1Props = useAnimatedProps(() => ({
        cy: cy - 10 + dropY1.value,
        opacity: 1 - dropY1.value / 60,
    }))
    const drop2Props = useAnimatedProps(() => ({
        cy: cy - 5 + dropY2.value,
        opacity: 1 - dropY2.value / 50,
    }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            <Defs>
                <RadialGradient id="burnGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FF6600" stopOpacity="0.2" />
                    <Stop offset="0.6" stopColor="#FF4400" stopOpacity="0.08" />
                    <Stop offset="1" stopColor="#FF4400" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#88DDFF" stopOpacity="0.9" />
                    <Stop offset="1" stopColor="#2288FF" stopOpacity="0.7" />
                </LinearGradient>
                <LinearGradient id="coolGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#44AAFF" stopOpacity="0.1" />
                    <Stop offset="1" stopColor="#2266FF" stopOpacity="0.3" />
                </LinearGradient>
            </Defs>

            {/* === HEAT GLOW (fading as water cools) === */}
            <AnimatedCircle cx={cx} cy={cy} r={100} fill="url(#burnGlow)" animatedProps={heatProps} />

            {/* Burn zone rings */}
            <Circle cx={cx} cy={cy} r={52}
                stroke="#FF6600" strokeWidth={2.5}
                fill="none" strokeDasharray="10 5" />
            <Circle cx={cx} cy={cy} r={38}
                stroke="#FF4400" strokeWidth={1.5}
                fill="rgba(255,68,0,0.1)" />
            
            {/* Burn center — damaged tissue indicator */}
            <Circle cx={cx} cy={cy} r={15}
                fill="rgba(200,60,0,0.4)"
                stroke="#FF6600" strokeWidth={2} />
            <Circle cx={cx - 4} cy={cy + 3} r={6}
                fill="rgba(255,100,30,0.5)" />

            {/* === 3D WATER STREAMS — thick, visible === */}
            {/* Stream 1 - left */}
            <AnimatedPath
                d={`M${cx - 25},${cy - 120} Q${cx - 30},${cy - 90} ${cx - 22},${cy - 60} Q${cx - 15},${cy - 30} ${cx - 20},${cy}`}
                stroke="#44BBFF" strokeWidth={5}
                fill="none" strokeLinecap="round"
                strokeDasharray="8 4"
                animatedProps={waterProps}
            />
            {/* Stream 2 - center */}
            <AnimatedPath
                d={`M${cx},${cy - 120} Q${cx + 6},${cy - 90} ${cx},${cy - 60} Q${cx - 6},${cy - 30} ${cx},${cy}`}
                stroke="#66CCFF" strokeWidth={6}
                fill="none" strokeLinecap="round"
                strokeDasharray="8 4"
                animatedProps={waterProps}
            />
            {/* Stream 3 - right */}
            <AnimatedPath
                d={`M${cx + 25},${cy - 120} Q${cx + 30},${cy - 90} ${cx + 22},${cy - 60} Q${cx + 15},${cy - 30} ${cx + 20},${cy}`}
                stroke="#44BBFF" strokeWidth={5}
                fill="none" strokeLinecap="round"
                strokeDasharray="8 4"
                animatedProps={waterProps}
            />

            {/* Water splash drops */}
            <AnimatedCircle cx={cx - 12} r={4} fill="#66CCFF" animatedProps={drop1Props} />
            <AnimatedCircle cx={cx + 10} r={3} fill="#88DDFF" animatedProps={drop2Props} />

            {/* Cooling zone around burn */}
            <Circle cx={cx} cy={cy} r={55} fill="url(#coolGrad)" />

            {/* === WATER SOURCE — faucet/tap indicator === */}
            <Rect x={cx - 30} y={cy - 135} width={60} height={8} rx={4} fill="rgba(100,180,255,0.8)" />
            <Rect x={cx - 5} y={cy - 135} width={10} height={15} rx={2} fill="rgba(100,180,255,0.9)" />
            
            <Rect x={cx - 60} y={cy - 155} width={120} height={24} rx={10} fill="rgba(20,80,180,0.9)" />
            <Rect x={cx - 60} y={cy - 155} width={120} height={12} rx={10} fill="rgba(255,255,255,0.12)" />
            <SvgText x={cx} y={cy - 139} textAnchor="middle"
                fill="#fff" fontSize={11} fontWeight="900" fontFamily="Courier">
                💧 POUR COOL WATER
            </SvgText>

            {/* === 10-MIN COUNTDOWN — prominent glass panel === */}
            <Rect x={cx - 65} y={cy + 58} width={130} height={48} rx={12} 
                fill="rgba(0,0,0,0.85)" stroke={timerColor} strokeWidth={2} />
            {/* Progress bar */}
            <Rect x={cx - 55} y={cy + 62} width={110} height={4} rx={2} fill="rgba(255,255,255,0.15)" />
            <Rect x={cx - 55} y={cy + 62} width={110 * progress} height={4} rx={2} fill={timerColor} />
            
            <SvgText x={cx} y={cy + 82} textAnchor="middle"
                fill={timerColor} fontSize={9} fontFamily="Courier">
                KEEP WATER FLOWING
            </SvgText>
            <SvgText x={cx} y={cy + 100} textAnchor="middle"
                fill={timerColor} fontSize={18} fontWeight="900" fontFamily="Courier">
                {String(remMins).padStart(2, '0')}:{String(remSecs).padStart(2, '0')}
            </SvgText>

            {/* === DANGER BADGES — glass panels === */}
            <Rect x={cx - 80} y={cy + 114} width={55} height={24} rx={8} fill="rgba(255,0,0,0.85)" />
            <Rect x={cx - 80} y={cy + 114} width={55} height={12} rx={8} fill="rgba(255,255,255,0.1)" />
            <SvgText x={cx - 52} y={cy + 130} textAnchor="middle"
                fill="#fff" fontSize={9} fontWeight="bold" fontFamily="Courier">
                🚫 ICE
            </SvgText>

            <Rect x={cx - 20} y={cy + 114} width={65} height={24} rx={8} fill="rgba(255,0,0,0.85)" />
            <Rect x={cx - 20} y={cy + 114} width={65} height={12} rx={8} fill="rgba(255,255,255,0.1)" />
            <SvgText x={cx + 12} y={cy + 130} textAnchor="middle"
                fill="#fff" fontSize={9} fontWeight="bold" fontFamily="Courier">
                🚫 BUTTER
            </SvgText>

            <Rect x={cx + 50} y={cy + 114} width={32} height={24} rx={8} fill="rgba(255,80,0,0.85)" />
            <SvgText x={cx + 66} y={cy + 130} textAnchor="middle"
                fill="#fff" fontSize={14}>
                ⓘ
            </SvgText>

            {/* Blister warning */}
            <Rect x={cx - 62} y={cy + 144} width={124} height={20} rx={8} 
                fill="rgba(0,0,0,0.7)" stroke="#FF8800" strokeWidth={1} />
            <SvgText x={cx} y={cy + 158} textAnchor="middle"
                fill="#FF8800" fontSize={9} fontWeight="bold" fontFamily="Courier">
                ⚠ NEVER POP BLISTERS
            </SvgText>
        </Svg>
    )
}
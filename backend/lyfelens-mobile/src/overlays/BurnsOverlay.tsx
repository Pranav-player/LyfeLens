import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import Animated, {
    useSharedValue, withRepeat, withTiming, useAnimatedProps
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedPath = Animated.createAnimatedComponent(Path)

type Props = { keypoint: { x: number, y: number } }

export default function BurnsOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    // Water flow animation
    const waterFlow = useSharedValue(0)
    useEffect(() => {
        waterFlow.value = withRepeat(withTiming(20, { duration: 800 }), -1, false)
    }, [])

    const waterProps = useAnimatedProps(() => ({
        strokeDashoffset: -waterFlow.value,
    }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Burn zone detection */}
            <Circle cx={cx} cy={cy} r={44}
                stroke="#FF6600" strokeWidth={2}
                fill="rgba(255,100,0,0.2)"
            />

            {/* Heat indicator rings */}
            <Circle cx={cx} cy={cy} r={36}
                stroke="#FF4400" strokeWidth={1}
                fill="rgba(255,68,0,0.1)"
            />

            {/* BURN DETECTED label */}
            <Rect x={cx - 45} y={cy - 60} width={90} height={18} rx={4}
                fill="rgba(255,80,0,0.8)"
            />
            <SvgText x={cx} y={cy - 47} textAnchor="middle"
                fill="#fff" fontSize={10} fontWeight="bold" fontFamily="Courier">
                BURN DETECTED
            </SvgText>

            {/* Cool water flow arrows — flowing downward */}
            <AnimatedPath
                d={`M${cx - 20},${cy - 100} Q${cx - 25},${cy - 80} ${cx - 18},${cy - 60} Q${cx - 10},${cy - 40} ${cx - 15},${cy - 20}`}
                stroke="#44AAFF" strokeWidth={3}
                fill="none" strokeLinecap="round"
                strokeDasharray="6 4"
                animatedProps={waterProps}
            />
            <AnimatedPath
                d={`M${cx},${cy - 100} Q${cx + 5},${cy - 80} ${cx},${cy - 60} Q${cx - 5},${cy - 40} ${cx},${cy - 20}`}
                stroke="#44AAFF" strokeWidth={3}
                fill="none" strokeLinecap="round"
                strokeDasharray="6 4"
                animatedProps={waterProps}
            />
            <AnimatedPath
                d={`M${cx + 20},${cy - 100} Q${cx + 25},${cy - 80} ${cx + 18},${cy - 60} Q${cx + 10},${cy - 40} ${cx + 15},${cy - 20}`}
                stroke="#44AAFF" strokeWidth={3}
                fill="none" strokeLinecap="round"
                strokeDasharray="6 4"
                animatedProps={waterProps}
            />

            {/* Water source indicator */}
            <Rect x={cx - 40} y={cy - 118} width={80} height={18} rx={4}
                fill="rgba(30,100,255,0.7)"
            />
            <SvgText x={cx} y={cy - 105} textAnchor="middle"
                fill="#fff" fontSize={10} fontFamily="Courier">
                POUR COOL WATER
            </SvgText>

            {/* 10 minute timer context */}
            <Rect x={cx - 50} y={cy + 52} width={100} height={20} rx={4}
                fill="rgba(0,60,150,0.8)"
            />
            <SvgText x={cx} y={cy + 66} textAnchor="middle"
                fill="#88CCFF" fontSize={10} fontFamily="Courier">
                10 MIN — NO ICE
            </SvgText>
        </Svg>
    )
}
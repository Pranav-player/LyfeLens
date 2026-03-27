import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Circle, Ellipse, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg'
import Animated, {
    useSharedValue, withRepeat, withSequence, withTiming, useAnimatedProps
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)

type Props = { keypoint: { x: number, y: number } }

export default function HeimlichOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    // Thrust animation — hands move inward and outward
    const thrustOffset = useSharedValue(0)
    useEffect(() => {
        thrustOffset.value = withRepeat(
            withSequence(
                withTiming(18, { duration: 300 }),  // thrust inward
                withTiming(0, { duration: 400 }),  // release
            ),
            -1, false
        )
    }, [])

    const leftFistProps = useAnimatedProps(() => ({
        cx: cx - 55 + thrustOffset.value,
    }))

    const rightFistProps = useAnimatedProps(() => ({
        cx: cx + 55 - thrustOffset.value,
    }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Target zone — upper abdomen, below chest */}
            <Ellipse cx={cx} cy={cy} rx={50} ry={28}
                stroke="#FF8800" strokeWidth={2.5}
                fill="rgba(255,136,0,0.15)"
            />

            {/* Center fist position marker */}
            <Circle cx={cx} cy={cy} r={10}
                stroke="#FF8800" strokeWidth={2}
                fill="rgba(255,136,0,0.3)"
            />

            {/* Left fist — animated inward thrust */}
            <AnimatedEllipse
                cy={cy} rx={20} ry={13}
                fill="rgba(255,136,0,0.7)" stroke="#FF8800" strokeWidth={2}
                animatedProps={leftFistProps}
            />

            {/* Right fist — animated inward thrust */}
            <AnimatedEllipse
                cy={cy} rx={20} ry={13}
                fill="rgba(255,136,0,0.7)" stroke="#FF8800" strokeWidth={2}
                animatedProps={rightFistProps}
            />

            {/* Thrust direction arrows */}
            <Polygon
                points={`${cx - 28},${cy} ${cx - 44},${cy - 10} ${cx - 44},${cy + 10}`}
                fill="#FF8800"
            />
            <Polygon
                points={`${cx + 28},${cy} ${cx + 44},${cy - 10} ${cx + 44},${cy + 10}`}
                fill="#FF8800"
            />

            {/* Upward thrust arrow */}
            <Line x1={cx} y1={cy + 20} x2={cx} y2={cy - 40}
                stroke="#FFCC00" strokeWidth={2.5} strokeLinecap="round" />
            <Polygon
                points={`${cx},${cy - 50} ${cx - 8},${cy - 36} ${cx + 8},${cy - 36}`}
                fill="#FFCC00"
            />
            <SvgText x={cx + 14} y={cy - 35} fill="#FFCC00" fontSize={10} fontFamily="Courier">
                UP
            </SvgText>

            {/* Label */}
            <Rect x={cx - 60} y={cy + 40} width={120} height={20} rx={4}
                fill="rgba(255,136,0,0.7)" />
            <SvgText x={cx} y={cy + 54} textAnchor="middle"
                fill="#fff" fontSize={11} fontWeight="bold" fontFamily="Courier">
                HEIMLICH — PULL INWARD + UP
            </SvgText>
        </Svg>
    )
}
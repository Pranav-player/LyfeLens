import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Circle, Ellipse, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg'
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedProps } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type Props = { keypoint: { x: number, y: number } }

export default function BleedingOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    // Pulsing pressure indicator — shows how hard to press
    const pressRadius = useSharedValue(30)
    const pressOpacity = useSharedValue(1)

    useEffect(() => {
        pressRadius.value = withRepeat(withTiming(44, { duration: 600 }), -1, true)
        pressOpacity.value = withRepeat(withTiming(0.2, { duration: 600 }), -1, true)
    }, [])

    const pulseProps = useAnimatedProps(() => ({
        r: pressRadius.value,
        opacity: pressOpacity.value,
    }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Wound detection circle */}
            <Circle cx={cx} cy={cy} r={32}
                stroke="#FF2222" strokeWidth={2.5}
                fill="rgba(255,30,30,0.15)"
            />

            {/* Pulse warning ring */}
            <AnimatedCircle
                cx={cx} cy={cy}
                stroke="#FF2222" strokeWidth={1.5}
                fill="none"
                animatedProps={pulseProps}
            />

            {/* Pressure arrow — pointing DOWN toward wound */}
            <Line x1={cx} y1={cy - 70} x2={cx} y2={cy - 42}
                stroke="#FF2222" strokeWidth={3} strokeLinecap="round" />
            <Polygon
                points={`${cx},${cy - 34} ${cx - 10},${cy - 48} ${cx + 10},${cy - 48}`}
                fill="#FF2222"
            />

            {/* Hand press indicator — flat hand shape */}
            <Ellipse cx={cx} cy={cy - 26} rx={24} ry={9}
                fill="rgba(255,80,80,0.6)" stroke="#FF4444" strokeWidth={2} />
            {/* Shadow under hand */}
            <Ellipse cx={cx + 3} cy={cy - 22} rx={24} ry={7}
                fill="rgba(0,0,0,0.3)" />

            {/* Tourniquet guide line — above wound */}
            <Line x1={cx - 50} y1={cy - 80} x2={cx + 50} y2={cy - 80}
                stroke="#FF8800" strokeWidth={3} strokeLinecap="round"
                strokeDasharray="8 4"
            />
            <SvgText x={cx} y={cy - 90} textAnchor="middle"
                fill="#FF8800" fontSize={11} fontFamily="Courier">
                TIE TIGHT HERE
            </SvgText>

            {/* Wound label */}
            <Rect x={cx - 38} y={cy + 40} width={76} height={18} rx={4}
                fill="rgba(255,30,30,0.7)" />
            <SvgText x={cx} y={cy + 53} textAnchor="middle"
                fill="#fff" fontSize={10} fontWeight="bold" fontFamily="Courier">
                WOUND DETECTED
            </SvgText>
        </Svg>
    )
}
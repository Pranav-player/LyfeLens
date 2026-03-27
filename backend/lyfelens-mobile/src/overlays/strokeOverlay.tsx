import React, { useEffect, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Circle, Rect, Line, Text as SvgText, Ellipse } from 'react-native-svg'
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedProps } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedRect = Animated.createAnimatedComponent(Rect)

type Props = { keypoint: { x: number, y: number } }

export default function StrokeOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    const urgencyFlash = useSharedValue(1)
    useEffect(() => {
        urgencyFlash.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true)
    }, [])
    const urgencyProps = useAnimatedProps(() => ({ opacity: urgencyFlash.value }))

    const FAST = [
        { letter: 'F', check: 'Face drooping?', color: '#FF4488', x: cx - 110, y: cy - 90 },
        { letter: 'A', check: 'Arm weakness?', color: '#FF8800', x: cx + 15, y: cy - 90 },
        { letter: 'S', check: 'Speech slurred?', color: '#FFCC00', x: cx - 110, y: cy + 10 },
        { letter: 'T', check: 'Time — call 112!', color: '#FF2222', x: cx + 15, y: cy + 10 },
    ]

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Face detection zone */}
            <Circle cx={cx} cy={cy} r={52}
                stroke="#FF4488" strokeWidth={2}
                fill="rgba(255,68,136,0.1)"
            />

            {/* Face droop indicator — diagonal line across face */}
            <Line x1={cx - 25} y1={cy + 15} x2={cx + 25} y2={cy + 30}
                stroke="#FF4488" strokeWidth={2.5}
                strokeDasharray="5 3" strokeLinecap="round"
            />
            <SvgText x={cx} y={cy - 60} textAnchor="middle"
                fill="#FF4488" fontSize={9} fontFamily="Courier">
                SCAN FACE FOR DROOPING
            </SvgText>

            {/* FAST check cards */}
            {FAST.map((f) => (
                <React.Fragment key={f.letter}>
                    <Rect x={f.x} y={f.y} width={90} height={65}
                        rx={6} fill="rgba(0,0,0,0.75)"
                        stroke={f.color} strokeWidth={1.5}
                    />
                    <SvgText x={f.x + 14} y={f.y + 32}
                        fill={f.color} fontSize={28} fontWeight="bold" fontFamily="Courier">
                        {f.letter}
                    </SvgText>
                    <SvgText x={f.x + 45} y={f.y + 25}
                        fill="white" fontSize={9} fontFamily="Courier">
                        {f.check.split(' ')[0]}
                    </SvgText>
                    <SvgText x={f.x + 45} y={f.y + 38}
                        fill={f.color} fontSize={8} fontFamily="Courier">
                        {f.check.split(' ').slice(1).join(' ')}
                    </SvgText>
                </React.Fragment>
            ))}

            {/* Flashing CALL 112 */}
            <AnimatedRect
                x={cx - 60} y={cy + 90} width={120} height={30} rx={6}
                fill="rgba(255,30,30,0.8)"
                animatedProps={urgencyProps}
            />
            <SvgText x={cx} y={cy + 110} textAnchor="middle"
                fill="#fff" fontSize={14} fontWeight="bold" fontFamily="Courier">
                CALL 112 NOW
            </SvgText>
        </Svg>
    )
}
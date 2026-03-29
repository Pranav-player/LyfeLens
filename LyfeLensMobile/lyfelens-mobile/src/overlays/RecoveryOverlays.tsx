import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Circle, Ellipse, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg'
import Animated, {
    useSharedValue, withRepeat, withSequence, withTiming, useAnimatedProps
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse)

type Props = { keypoint: { x: number, y: number } }

export default function RecoveryOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    // Rolling animation — body rocks slightly
    const rollCx = useSharedValue(cx)
    useEffect(() => {
        rollCx.value = withRepeat(
            withSequence(
                withTiming(cx + 15, { duration: 1000 }),
                withTiming(cx, { duration: 1000 }),
            ),
            -1, false
        )
    }, [])

    const bodyProps = useAnimatedProps(() => ({ cx: rollCx.value }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Body indicator — animated roll */}
            <AnimatedEllipse
                cy={cy} rx={55} ry={22}
                fill="rgba(0,170,255,0.2)"
                stroke="#00AAFF" strokeWidth={2}
                animatedProps={bodyProps}
            />

            {/* Roll direction — big arrow pointing right */}
            <Line x1={cx + 30} y1={cy} x2={cx + 100} y2={cy}
                stroke="#00AAFF" strokeWidth={4} strokeLinecap="round" />
            <Polygon
                points={`${cx + 112},${cy} ${cx + 94},${cy - 12} ${cx + 94},${cy + 12}`}
                fill="#00AAFF"
            />

            {/* Step indicators */}
            {[
                { num: '1', text: 'Tilt head back', y: cy - 80 },
                { num: '2', text: 'Bend top knee', y: cy - 55 },
                { num: '3', text: 'Roll onto side', y: cy - 30 },
            ].map((step) => (
                <React.Fragment key={step.num}>
                    <Circle cx={cx - 90} cy={step.y + 6} r={10}
                        fill="rgba(0,170,255,0.3)" stroke="#00AAFF" strokeWidth={1.5} />
                    <SvgText x={cx - 90} y={step.y + 10} textAnchor="middle"
                        fill="#00AAFF" fontSize={10} fontWeight="bold">{step.num}</SvgText>
                    <SvgText x={cx - 74} y={step.y + 10}
                        fill="#fff" fontSize={10} fontFamily="Courier">{step.text}</SvgText>
                </React.Fragment>
            ))}

            {/* Airway open indicator */}
            <Rect x={cx - 55} y={cy + 35} width={110} height={20} rx={4}
                fill="rgba(0,100,200,0.7)"
            />
            <SvgText x={cx} y={cy + 49} textAnchor="middle"
                fill="#fff" fontSize={10} fontFamily="Courier">
                KEEP AIRWAY OPEN
            </SvgText>
        </Svg>
    )
}
import React, { useEffect } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Line, Circle, Rect, Path, Text as SvgText } from 'react-native-svg'
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedProps } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedRect = Animated.createAnimatedComponent(Rect)

type Props = { keypoint: { x: number, y: number } }

export default function FractureOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height

    // Warning flash
    const warnOpacity = useSharedValue(1)
    useEffect(() => {
        warnOpacity.value = withRepeat(withTiming(0.3, { duration: 500 }), -1, true)
    }, [])

    const warnProps = useAnimatedProps(() => ({ opacity: warnOpacity.value }))

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Danger zone around fracture */}
            <Circle cx={cx} cy={cy} r={50}
                stroke="#FF6600" strokeWidth={2}
                strokeDasharray="6 4"
                fill="rgba(255,100,0,0.1)"
            />

            {/* Flashing warning box */}
            <AnimatedRect
                x={cx - 38} y={cy - 16} width={76} height={32} rx={4}
                fill="rgba(255,60,0,0.6)"
                animatedProps={warnProps}
            />
            <SvgText x={cx} y={cy + 6} textAnchor="middle"
                fill="#fff" fontSize={13} fontWeight="bold" fontFamily="Courier">
                DO NOT MOVE
            </SvgText>

            {/* Bone break indicator — jagged line */}
            <Path
                d={`M${cx - 30},${cy + 30} L${cx - 10},${cy + 20} L${cx},${cy + 35} L${cx + 10},${cy + 20} L${cx + 30},${cy + 30}`}
                stroke="#FF6600" strokeWidth={2.5}
                fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
            <SvgText x={cx} y={cy + 55} textAnchor="middle"
                fill="#FF6600" fontSize={10} fontFamily="Courier">
                FRACTURE ZONE
            </SvgText>

            {/* Keep still arrows — pointing inward from both sides */}
            <Line x1={cx - 90} y1={cy} x2={cx - 58} y2={cy}
                stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={cx - 58} y1={cy - 8} x2={cx - 52} y2={cy}
                stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={cx - 58} y1={cy + 8} x2={cx - 52} y2={cy}
                stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />

            <Line x1={cx + 90} y1={cy} x2={cx + 58} y2={cy}
                stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={cx + 58} y1={cy - 8} x2={cx + 52} y2={cy}
                stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={cx + 58} y1={cy + 8} x2={cx + 52} y2={cy}
                stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />

            <SvgText x={cx - 95} y={cy - 10} textAnchor="middle"
                fill="#FF6600" fontSize={9} fontFamily="Courier">HOLD</SvgText>
            <SvgText x={cx + 95} y={cy - 10} textAnchor="middle"
                fill="#FF6600" fontSize={9} fontFamily="Courier">HOLD</SvgText>
        </Svg>
    )
}
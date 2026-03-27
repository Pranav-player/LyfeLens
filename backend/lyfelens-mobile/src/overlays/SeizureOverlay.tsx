import React, { useEffect, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg'
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedProps } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type Props = { keypoint: { x: number, y: number } }

export default function SeizureOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height
    const [seconds, setSeconds] = useState(0)

    // Timer — counts up to track seizure duration
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    // Warning flash
    const flash = useSharedValue(0.15)
    useEffect(() => {
        flash.value = withRepeat(withTiming(0.35, { duration: 800 }), -1, true)
    }, [])
    const flashProps = useAnimatedProps(() => ({ fillOpacity: flash.value }))

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const timerColor = seconds > 300 ? '#FF2222' : seconds > 120 ? '#FF8800' : '#FFCC00'

    return (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Full body danger zone */}
            <AnimatedCircle
                cx={cx} cy={cy} r={130}
                stroke="#FF3232" strokeWidth={1.5}
                strokeDasharray="10 6"
                fill="#FF3232"
                animatedProps={flashProps}
            />

            {/* Inner body zone */}
            <Circle cx={cx} cy={cy} r={75}
                stroke="#FF3232" strokeWidth={2}
                fill="rgba(255,50,50,0.1)"
            />

            {/* DO NOT HOLD sign */}
            <Rect x={cx - 52} y={cy - 18} width={104} height={36} rx={6}
                fill="rgba(0,0,0,0.7)" stroke="#FF3232" strokeWidth={1.5}
            />
            <Line x1={cx - 36} y1={cy - 2} x2={cx + 36} y2={cy - 2}
                stroke="#FF3232" strokeWidth={4} strokeLinecap="round" />
            <SvgText x={cx} y={cy + 14} textAnchor="middle"
                fill="#FF3232" fontSize={10} fontWeight="bold" fontFamily="Courier">
                DO NOT RESTRAIN
            </SvgText>

            {/* Clear space arrows — pointing outward */}
            {[0, 90, 180, 270].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                const x1 = cx + Math.cos(rad) * 80
                const y1 = cy + Math.sin(rad) * 80
                const x2 = cx + Math.cos(rad) * 140
                const y2 = cy + Math.sin(rad) * 140
                return (
                    <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#FF8800" strokeWidth={2.5} strokeLinecap="round"
                    />
                )
            })}

            {/* SEIZURE TIMER */}
            <Rect x={cx - 45} y={cy - 120} width={90} height={40} rx={6}
                fill="rgba(0,0,0,0.8)" stroke={timerColor} strokeWidth={1.5}
            />
            <SvgText x={cx} y={cy - 105} textAnchor="middle"
                fill={timerColor} fontSize={9} fontFamily="Courier">
                SEIZURE TIMER
            </SvgText>
            <SvgText x={cx} y={cy - 88} textAnchor="middle"
                fill={timerColor} fontSize={16} fontWeight="bold" fontFamily="Courier">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </SvgText>
            {seconds > 300 &&
                <SvgText x={cx} y={cy + 155} textAnchor="middle"
                    fill="#FF2222" fontSize={12} fontWeight="bold" fontFamily="Courier">
                    OVER 5 MIN — CALL 112 NOW
                </SvgText>
            }
        </Svg>
    )
}
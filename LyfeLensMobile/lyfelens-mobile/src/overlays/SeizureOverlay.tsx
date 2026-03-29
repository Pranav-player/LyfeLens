import React, { useEffect, useState } from 'react'
import { Dimensions, StyleSheet } from 'react-native'
import Svg, { 
  Circle, Line, Rect, Text as SvgText, Ellipse,
  Defs, LinearGradient, Stop, RadialGradient 
} from 'react-native-svg'
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedProps } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const AnimatedRect = Animated.createAnimatedComponent(Rect)

type Props = { keypoint: { x: number, y: number } }

export default function SeizureOverlay({ keypoint }: Props) {
    const cx = keypoint.x * width
    const cy = keypoint.y * height
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    const flash = useSharedValue(0.08)
    const ringPulse = useSharedValue(140)
    const ringOpacity = useSharedValue(0.5)

    useEffect(() => {
        flash.value = withRepeat(
            withSequence(
                withTiming(0.2, { duration: 1200 }),
                withTiming(0.08, { duration: 1200 })
            ), -1, false
        )
        ringPulse.value = withRepeat(withTiming(200, { duration: 2000 }), -1, false)
        ringOpacity.value = withRepeat(withTiming(0, { duration: 2000 }), -1, false)
    }, [])

    const flashProps = useAnimatedProps(() => ({ fillOpacity: flash.value }))
    const expandProps = useAnimatedProps(() => ({
        r: ringPulse.value,
        opacity: ringOpacity.value,
    }))

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const timerColor = seconds > 300 ? '#FF2222' : seconds > 120 ? '#FF8800' : '#FFCC00'
    const isEmergency = seconds > 300

    return (
        <Svg style={StyleSheet.absoluteFill}>
            <Defs>
                <RadialGradient id="dangerZone" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FF3232" stopOpacity="0.12" />
                    <Stop offset="0.5" stopColor="#FF3232" stopOpacity="0.05" />
                    <Stop offset="1" stopColor="#FF3232" stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="timerGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={timerColor} stopOpacity="0.3" />
                    <Stop offset="1" stopColor={timerColor} stopOpacity="0.1" />
                </LinearGradient>
            </Defs>

            {/* === SAFETY ZONE — expanding danger area === */}
            <AnimatedCircle cx={cx} cy={cy} fill="#FF3232" animatedProps={flashProps} r={150} />
            <AnimatedCircle cx={cx} cy={cy} stroke="#FF8800" strokeWidth={2} fill="none" animatedProps={expandProps} />

            {/* Safety perimeter rings */}
            <Circle cx={cx} cy={cy} r={150}
                stroke="#FF8800" strokeWidth={2}
                strokeDasharray="14 6" fill="none" opacity={0.5} />
            <Circle cx={cx} cy={cy} r={100}
                stroke="#FFCC00" strokeWidth={1.5}
                strokeDasharray="8 4" fill="none" opacity={0.4} />
            <Circle cx={cx} cy={cy} r={60}
                stroke="#FFCC00" strokeWidth={1}
                fill="rgba(255,200,0,0.06)" />

            {/* === CLEAR SPACE arrows — 8 directions === */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                const x1 = cx + Math.cos(rad) * 100
                const y1 = cy + Math.sin(rad) * 100
                const x2 = cx + Math.cos(rad) * 160
                const y2 = cy + Math.sin(rad) * 160
                return (
                    <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#FF8800" strokeWidth={2.5} strokeLinecap="round"
                        opacity={0.5} strokeDasharray="6 4"
                    />
                )
            })}

            {/* === CLEAR OBJECTS — glass panel === */}
            <Rect x={cx - 65} y={cy - 100} width={130} height={28} rx={10} fill="rgba(255,136,0,0.9)" />
            <Rect x={cx - 65} y={cy - 100} width={130} height={14} rx={10} fill="rgba(255,255,255,0.12)" />
            <SvgText x={cx} y={cy - 82} textAnchor="middle"
                fill="#fff" fontSize={12} fontWeight="900" fontFamily="Courier">
                🪑 CLEAR ALL OBJECTS
            </SvgText>

            {/* === MAIN INSTRUCTION — DON'T HOLD === */}
            <Rect x={cx - 80} y={cy - 30} width={160} height={60} rx={14}
                fill="rgba(0,0,0,0.85)" stroke="#FFCC00" strokeWidth={2} />
            <Rect x={cx - 80} y={cy - 30} width={160} height={30} rx={14}
                fill="rgba(255,255,255,0.06)" />
            <SvgText x={cx} y={cy - 8} textAnchor="middle"
                fill="#FFCC00" fontSize={14} fontWeight="900" fontFamily="Courier">
                ✋ DON'T HOLD THEM
            </SvgText>
            <SvgText x={cx} y={cy + 10} textAnchor="middle"
                fill="rgba(255,255,255,0.7)" fontSize={10} fontFamily="Courier">
                Let them move freely
            </SvgText>
            <SvgText x={cx} y={cy + 24} textAnchor="middle"
                fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="Courier">
                Cushion their head if possible
            </SvgText>

            {/* === SEIZURE TIMER — large, prominent === */}
            <Rect x={cx - 60} y={cy + 45} width={120} height={58} rx={12}
                fill="rgba(0,0,0,0.9)" stroke={timerColor} strokeWidth={2} />
            {/* Timer header */}
            <SvgText x={cx} y={cy + 62} textAnchor="middle"
                fill={timerColor} fontSize={9} fontWeight="bold" fontFamily="Courier">
                ⏱ SEIZURE DURATION
            </SvgText>
            {/* Timer value */}
            <SvgText x={cx} y={cy + 88} textAnchor="middle"
                fill={timerColor} fontSize={24} fontWeight="900" fontFamily="Courier">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </SvgText>

            {/* === 5-MINUTE EMERGENCY === */}
            {isEmergency && (
                <>
                    <Rect x={cx - 75} y={cy + 112} width={150} height={30} rx={10} fill="#FF2222" />
                    <Rect x={cx - 75} y={cy + 112} width={150} height={15} rx={10} fill="rgba(255,255,255,0.15)" />
                    <SvgText x={cx} y={cy + 132} textAnchor="middle"
                        fill="#fff" fontSize={14} fontWeight="900" fontFamily="Courier">
                        🚨 CALL 112 NOW!
                    </SvgText>
                </>
            )}

            {/* === AFTER SEIZURE guide === */}
            <Rect x={cx - 72} y={cy + (isEmergency ? 150 : 112)} width={144} height={24} rx={8}
                fill="rgba(0,0,0,0.75)" stroke="#44AAFF" strokeWidth={1.5} />
            <SvgText x={cx} y={cy + (isEmergency ? 166 : 128)} textAnchor="middle"
                fill="#44AAFF" fontSize={10} fontWeight="bold" fontFamily="Courier">
                After → Roll onto side ↩
            </SvgText>
        </Svg>
    )
}
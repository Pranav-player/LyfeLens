import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

type Props = {
    box: { x: number, y: number, w: number, h: number };
    label: string;
    color?: string;
};

export default function DetectionBox({ box, label, color = "#00FF88" }: Props) {
    const x = box.x * width - (box.w * width) / 2;
    const y = box.y * height - (box.h * height) / 2;
    const w = box.w * width;
    const h = box.h * height;

    // Corner bracket length
    const cornerLen = 25;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'transparent' }}>
                <Defs>
                    <LinearGradient id="boxGlow" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.08" />
                        <Stop offset="0.5" stopColor={color} stopOpacity="0.02" />
                        <Stop offset="1" stopColor={color} stopOpacity="0.08" />
                    </LinearGradient>
                </Defs>

                {/* Subtle fill */}
                <Rect x={x} y={y} width={w} height={h} fill="url(#boxGlow)" />

                {/* === CORNER BRACKETS instead of full border === */}
                {/* Top-left */}
                <Line x1={x} y1={y} x2={x + cornerLen} y2={y} stroke={color} strokeWidth={2.5} />
                <Line x1={x} y1={y} x2={x} y2={y + cornerLen} stroke={color} strokeWidth={2.5} />
                
                {/* Top-right */}
                <Line x1={x + w - cornerLen} y1={y} x2={x + w} y2={y} stroke={color} strokeWidth={2.5} />
                <Line x1={x + w} y1={y} x2={x + w} y2={y + cornerLen} stroke={color} strokeWidth={2.5} />
                
                {/* Bottom-left */}
                <Line x1={x} y1={y + h - cornerLen} x2={x} y2={y + h} stroke={color} strokeWidth={2.5} />
                <Line x1={x} y1={y + h} x2={x + cornerLen} y2={y + h} stroke={color} strokeWidth={2.5} />
                
                {/* Bottom-right */}
                <Line x1={x + w - cornerLen} y1={y + h} x2={x + w} y2={y + h} stroke={color} strokeWidth={2.5} />
                <Line x1={x + w} y1={y + h - cornerLen} x2={x + w} y2={y + h} stroke={color} strokeWidth={2.5} />

                {/* Dashed connecting lines (subtle) */}
                <Line x1={x + cornerLen} y1={y} x2={x + w - cornerLen} y2={y} 
                    stroke={color} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
                <Line x1={x + cornerLen} y1={y + h} x2={x + w - cornerLen} y2={y + h} 
                    stroke={color} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
                <Line x1={x} y1={y + cornerLen} x2={x} y2={y + h - cornerLen} 
                    stroke={color} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
                <Line x1={x + w} y1={y + cornerLen} x2={x + w} y2={y + h - cornerLen} 
                    stroke={color} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />

                {/* Label badge — glass panel */}
                <Rect
                    x={x}
                    y={y > 28 ? y - 28 : y}
                    width={Math.min(label.length * 8 + 16, w)}
                    height={24}
                    rx={8}
                    fill={color}
                    opacity={0.9}
                />
                {/* Glass highlight */}
                <Rect
                    x={x}
                    y={y > 28 ? y - 28 : y}
                    width={Math.min(label.length * 8 + 16, w)}
                    height={12}
                    rx={8}
                    fill="rgba(255,255,255,0.15)"
                />
                <SvgText
                    x={x + 8}
                    y={y > 28 ? y - 11 : y + 16}
                    fill="#000"
                    fontSize={11}
                    fontWeight="900"
                    fontFamily="Courier"
                >
                    {label}
                </SvgText>

                {/* Bottom-right dimension text */}
                <SvgText
                    x={x + w - 5}
                    y={y + h + 14}
                    textAnchor="end"
                    fill={color}
                    fontSize={8}
                    fontFamily="Courier"
                    opacity={0.5}
                >
                    {Math.round(w)}×{Math.round(h)}
                </SvgText>
            </Svg>
        </View>
    );
}

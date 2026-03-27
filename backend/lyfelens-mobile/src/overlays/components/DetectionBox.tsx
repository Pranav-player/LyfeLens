import React from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

type Props = {
    box: { x: number, y: number, w: number, h: number };
    label: string;
    color?: string;
};

export default function DetectionBox({ box, label, color = "#00FF88" }: Props) {
    // Convert normalized coordinates (0-1) to screen coordinates
    const x = box.x * width - (box.w * width) / 2;
    const y = box.y * height - (box.h * height) / 2;
    const w = box.w * width;
    const h = box.h * height;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'transparent' }}>
                {/* Border box */}
                <Rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    stroke={color}
                    strokeWidth={2}
                    fill="rgba(0,0,0,0.1)"
                    strokeDasharray="8 4"
                />

                {/* Label background */}
                <Rect
                    x={x}
                    y={y > 20 ? y - 20 : y}
                    width={label.length * 8 + 10} // Estimate width
                    height={20}
                    fill={color}
                />

                {/* Label text */}
                <SvgText
                    x={x + 5}
                    y={y > 20 ? y - 6 : y + 14}
                    fill="#000"
                    fontSize={12}
                    fontWeight="bold"
                    fontFamily="Courier"
                >
                    {label}
                </SvgText>
            </Svg>
        </View>
    );
}

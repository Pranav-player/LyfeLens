import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

export default function Pseudo3DHologram({ x, y, conditionCode }: { x: number, y: number, conditionCode: string }) {
    // Screen coordinates from MoveNet
    const posX = x * 400 - 150; // Centering the 300px animation
    const posY = y * 800 - 150; 

    // Reanimated hooks to create the "breathing" pseudo-3D parallax effect
    const animatedStyle = useAnimatedStyle(() => {
        // We simulate a 3D perspective by continuously transforming X/Y rotators slightly
        const rotateX = withRepeat(
            withSequence(
                withTiming('15deg', { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming('-5deg', { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        const rotateZ = withRepeat(
            withTiming('5deg', { duration: 3000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        const floatY = withRepeat(
            withTiming(posY - 20, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        return {
            position: 'absolute',
            left: posX,
            top: floatY, // Dynamic floating effect based on user's chest Y coordinate
            width: 300,
            height: 300,
            transform: [
                { perspective: 400 }, // Creates 3D depth illusion
                { rotateX: rotateX },
                { rotateZ: rotateZ },
            ],
            shadowColor: '#ff0044', // Red hologram glow
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 20,
            elevation: 10, // Glowing effect on Android
        };
    });

    if (conditionCode === 'NONE') return null;

    // For a real Cardiac Arrest, we are going to use a highly detailed, rotating 3D heart mapped by Lottie JSON
    const lottieSource = conditionCode === 'CARDIAC_ARREST' 
        ? require('../../../../assets/medical_heart.json') // We will download a free 3D lottie next
        : null;

    if (!lottieSource) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* The Animated.View applies the Pseudo-3D transforms to the flat Lottie file */}
            <Animated.View style={animatedStyle}>
                <LottieView
                    source={lottieSource}
                    autoPlay
                    loop
                    style={{ flex: 1, opacity: 0.8 }} // 0.8 opacity to look like a hologram overlay
                />
            </Animated.View>
            
            {/* Targeting Ring - locks onto the MoveNet coordinates */}
            <View style={[styles.targetRing, { left: posX + 100, top: posY + 100 }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    targetRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(255, 0, 68, 0.4)',
        borderStyle: 'dashed',
    }
});

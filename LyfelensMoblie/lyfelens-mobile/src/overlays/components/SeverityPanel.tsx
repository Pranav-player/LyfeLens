import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

type Props = {
  level: SeverityLevel;
};

const SEVERITY_CONFIG = {
  'LOW': { color: '#00AAFF', label: 'LOW RISK' },
  'MODERATE': { color: '#FFCC00', label: 'MODERATE' },
  'HIGH': { color: '#FF8800', label: 'HIGH RISK' },
  'CRITICAL': { color: '#FF2222', label: 'CRITICAL' },
};

export default function SeverityPanel({ level }: Props) {
  const config = SEVERITY_CONFIG[level] || SEVERITY_CONFIG['LOW'];
  
  // Flash animation for CRITICAL
  const flashOpacity = useSharedValue(1);
  
  useEffect(() => {
    if (level === 'CRITICAL' || level === 'HIGH') {
      flashOpacity.value = withRepeat(
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
    } else {
      flashOpacity.value = 1;
    }
  }, [level]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Animated.View style={[
      styles.container, 
      { backgroundColor: `rgba(0,0,0,0.8)`, borderColor: config.color },
      animatedStyle
    ]}>
      <Text style={[styles.label, { color: config.color }]}>
        SEVERITY: {config.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    letterSpacing: 1,
  }
});

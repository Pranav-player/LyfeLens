import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  title: string;
  description: string;
};

export default function InfoPanel({ title, description }: Props) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse the dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Slide in from top
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      {/* Glass effect top bar */}
      <View style={styles.glassBar} />
      
      <View style={styles.header}>
        <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      {/* Golden time indicator */}
      <View style={styles.goldenTime}>
        <Text style={styles.goldenTimeText}>⏱ ACT NOW — Every second counts</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 55,
    left: 14,
    right: 80,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  glassBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF2222',
    marginRight: 10,
    shadowColor: '#FF2222',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
    flex: 1,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontFamily: 'Courier',
    lineHeight: 17,
  },
  goldenTime: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,200,0,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.3)',
    alignSelf: 'flex-start',
  },
  goldenTimeText: {
    color: '#FFCC00',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  },
});

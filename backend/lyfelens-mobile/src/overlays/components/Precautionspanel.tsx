import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  precautions: string[];
};

export default function PrecautionsPanel({ precautions }: Props) {
  if (!precautions || precautions.length === 0) return null;

  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 8, delay: 200 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }], opacity: opacityAnim }]}>
      {/* Glass effect */}
      <View style={styles.glassBar} />
      
      <Text style={styles.headerTitle}>⚠️ DO NOT</Text>
      <View style={styles.listContainer}>
        {precautions.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>✕</Text>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 160,
    right: 14,
    width: 170,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderColor: '#FF2222',
    borderWidth: 1.5,
    borderRightWidth: 4,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  glassBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    color: '#FF2222',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Courier',
    marginBottom: 8,
    letterSpacing: 1,
  },
  listContainer: {
    gap: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#FF4444',
    fontSize: 12,
    marginRight: 6,
    lineHeight: 15,
    fontWeight: 'bold',
  },
  itemText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontFamily: 'Courier',
    lineHeight: 14,
    flex: 1,
    fontWeight: '600',
  }
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  title: string;
  description: string;
};

export default function InfoPanel({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pulseDot} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88', // Info green color
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
    marginRight: 10,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: 'Courier',
    lineHeight: 18,
  }
});

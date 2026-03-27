import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  precautions: string[];
};

export default function PrecautionsPanel({ precautions }: Props) {
  if (!precautions || precautions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>⚠️ CRITICAL DONT'S</Text>
      <View style={styles.listContainer}>
        {precautions.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>×</Text>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 150,
    right: 20,
    width: 180,
    backgroundColor: 'rgba(255,40,40,0.15)',
    borderColor: '#FF2222',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  headerTitle: {
    color: '#FF2222',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Courier',
    marginBottom: 8,
  },
  listContainer: {
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#FF2222',
    fontSize: 16,
    marginRight: 6,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  itemText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Courier',
    lineHeight: 14,
    flex: 1,
  }
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

type Props = {
  primaryAction: string;
  onPrimaryPress: () => void;
  secondaryAction?: string;
  onSecondaryPress?: () => void;
};

export default function ActionBar({
  primaryAction,
  onPrimaryPress,
  secondaryAction = "CANCEL",
  onSecondaryPress
}: Props) {
  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        {secondaryAction && (
          <TouchableOpacity 
             style={[styles.button, styles.secondaryButton]} 
             onPress={onSecondaryPress}
             activeOpacity={0.7}
          >
            <Text style={styles.secondaryText}>{secondaryAction}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
           style={[styles.button, styles.primaryButton]}
           onPress={onPrimaryPress}
           activeOpacity={0.8}
        >
          <Text style={styles.primaryText}>{primaryAction}</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#FF2222', // Red for emergency actions
    flex: 2,
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flex: 1,
  },
  primaryText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Courier',
    letterSpacing: 0.5,
  }
});

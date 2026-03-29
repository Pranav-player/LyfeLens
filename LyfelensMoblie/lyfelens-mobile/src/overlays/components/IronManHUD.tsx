import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import DetectionBox from './DetectionBox';
import InfoPanel from './InfoPanel';
import PrecautionsPanel from './Precautionspanel';

const { width } = Dimensions.get('window');

type HUDData = {
  label: string;
  description: string;
  precautions: string[];
  box: { x: number, y: number, w: number, h: number };
};

type Props = {
  data: HUDData | null;
  isScanning: boolean;
};

const CONDITION_COLORS: Record<string, string> = {
  CARDIAC_ARREST: '#FF2222',
  BLEEDING: '#FF4444',
  BURNS: '#FF6600',
  CHOKING: '#FF8800',
  SEIZURE: '#FFCC00',
  STROKE: '#FF3366',
  UNCONSCIOUS_BREATHING: '#4488FF',
  FRACTURE: '#FF9900',
};

export default function IronManHUD({ data, isScanning }: Props) {
  // 1. SCANNING MODE — calm, non-alarming
  if (isScanning || !data) {
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]} pointerEvents="none">
        <DetectionBox 
            box={{ x: 0.5, y: 0.5, w: 0.55, h: 0.55 }} 
            label="SCANNING... POINT AT PERSON" 
            color="rgba(0, 255, 255, 0.5)" 
        />
        
        {/* Calm scanning hint */}
        <View style={styles.scanHint}>
          <Text style={styles.scanHintText}>📷 Point camera at the emergency</Text>
        </View>
      </View>
    );
  }

  // Determine color by condition
  const conditionKey = data.label.includes('CARDIAC') ? 'CARDIAC_ARREST' :
                       data.label.includes('BLEED') ? 'BLEEDING' :
                       data.label.includes('BURN') ? 'BURNS' :
                       data.label.includes('CHOK') ? 'CHOKING' :
                       data.label.includes('SEIZURE') ? 'SEIZURE' :
                       data.label.includes('STROKE') ? 'STROKE' :
                       data.label.includes('UNCONSCIOUS') ? 'UNCONSCIOUS_BREATHING' : 'CARDIAC_ARREST';
  
  const color = CONDITION_COLORS[conditionKey] || '#FF2222';

  // 2. EMERGENCY LOCKED MODE
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]} pointerEvents="box-none">
        {/* Detection box around the target */}
        <DetectionBox 
            box={data.box} 
            label={`🚨 ${data.label}`} 
            color={color} 
        />

        {/* Info panel with description */}
        <InfoPanel 
            title={data.label} 
            description={data.description} 
        />

        {/* Critical don'ts panel */}
        <PrecautionsPanel 
            precautions={data.precautions} 
        />
    </View>
  );
}

const styles = StyleSheet.create({
  scanHint: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  scanHintText: {
    color: 'rgba(0,255,255,0.8)',
    fontSize: 13,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
});

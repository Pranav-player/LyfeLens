import React from 'react';
import { View, StyleSheet } from 'react-native';
import DetectionBox from './DetectionBox';
import InfoPanel from './InfoPanel';
import PrecautionsPanel from './Precautionspanel'; // Note exact filename

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

export default function IronManHUD({ data, isScanning }: Props) {
  // 1. SCANNING MODE (Idle, no emergency detected)
  if (isScanning || !data) {
    return (
      <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]} pointerEvents="none">
        {/* Glowy Cyan Scanning Reticle */}
        <DetectionBox 
            box={{ x: 0.5, y: 0.5, w: 0.6, h: 0.6 }} 
            label="SYS.SCANNING... AWAITING TARGET" 
            color="rgba(0, 255, 255, 0.7)" 
        />
      </View>
    );
  }

  // 2. TARGET LOCKED MODE (Emergency identified)
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100, elevation: 100 }]} pointerEvents="none">
        <DetectionBox 
            box={data.box} 
            label={`[TARGET LOCKED: ${data.label}]`} 
            color="#FF2222" 
        />
        <InfoPanel 
            title={data.label} 
            description={data.description} 
        />
        <PrecautionsPanel 
            precautions={data.precautions} 
        />
    </View>
  );
}

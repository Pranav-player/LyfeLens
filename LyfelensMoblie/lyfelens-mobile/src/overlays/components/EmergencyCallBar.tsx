import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';

type Props = {
    condition: string;
    currentStep: number;
    totalSteps: number;
    stepText: string;
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

const CONDITION_LABELS: Record<string, string> = {
    CARDIAC_ARREST: '🫀 CARDIAC ARREST',
    BLEEDING: '🩸 SEVERE BLEEDING',
    BURNS: '🔥 BURN INJURY',
    CHOKING: '😮 CHOKING',
    SEIZURE: '⚡ SEIZURE',
    STROKE: '🧠 STROKE',
    UNCONSCIOUS_BREATHING: '💤 UNCONSCIOUS',
    FRACTURE: '🦴 FRACTURE',
};

export default function EmergencyCallBar({ condition, currentStep, totalSteps, stepText }: Props) {
    const color = CONDITION_COLORS[condition] || '#FF2222';
    const label = CONDITION_LABELS[condition] || condition;

    const callEmergency = () => {
        const number = Platform.OS === 'ios' ? 'tel:112' : 'tel:112';
        Linking.openURL(number).catch(() => {});
    };

    return (
        <View style={styles.container}>
            {/* Step instruction card */}
            <View style={[styles.stepCard, { borderLeftColor: color }]}>
                <View style={styles.stepHeader}>
                    <Text style={[styles.conditionBadge, { backgroundColor: color }]}>
                        {label}
                    </Text>
                    <Text style={styles.stepCounter}>
                        Step {currentStep}/{totalSteps}
                    </Text>
                </View>
                <Text style={styles.stepText} numberOfLines={3}>
                    {stepText || 'Analyzing situation...'}
                </Text>
            </View>

            {/* Emergency call button */}
            <TouchableOpacity
                style={styles.callButton}
                onPress={callEmergency}
                activeOpacity={0.7}
            >
                <Text style={styles.callIcon}>📞</Text>
                <Text style={styles.callText}>112</Text>
                <Text style={styles.callSubtext}>EMERGENCY</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 10,
    },
    stepCard: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 14,
        borderLeftWidth: 4,
        padding: 12,
        justifyContent: 'center',
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    conditionBadge: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        fontFamily: 'Courier',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
        letterSpacing: 0.5,
    },
    stepCounter: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
    stepText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'Courier',
        lineHeight: 18,
        fontWeight: '600',
    },
    callButton: {
        width: 72,
        backgroundColor: '#FF2222',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
    },
    callIcon: {
        fontSize: 22,
    },
    callText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        fontFamily: 'Courier',
    },
    callSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 7,
        fontWeight: 'bold',
        fontFamily: 'Courier',
        letterSpacing: 1,
    },
});

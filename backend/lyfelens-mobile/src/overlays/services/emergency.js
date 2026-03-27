import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Linking, Alert } from 'react-native';
import { sendEmergencyAlert } from './api';

export const triggerEmergency = async (sessionId, condition) => {
    try {
        // 1. Grab precise GPS coordinates
        let { status } = await Location.requestForegroundPermissionsAsync();
        let lat = 0, lng = 0;

        if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
        }

        // 2. Fire alert to your Express Backend (Firebase logging)
        // This runs in the background so it doesn't slow down the phone call
        sendEmergencyAlert(sessionId, lat, lng, condition);

        // 3. Prepare the automated SMS with GPS
        const isSmsAvailable = await SMS.isAvailableAsync();
        if (isSmsAvailable) {
            await SMS.sendSMSAsync(
                ['112'], // You can add custom emergency contacts here too
                `LyfeLens Automated Alert: Severe ${condition} detected. GPS Coordinates: ${lat}, ${lng}. Send medical help immediately.`
            );
        } else {
            Alert.alert("SMS Unavailable", "Could not open SMS app.");
        }

        // 4. Force open the phone dialer to 112
        Linking.openURL('tel:112');

    } catch (error) {
        console.error("Emergency trigger failed:", error);
        // Absolute fallback: just call 112 if everything else crashes
        Linking.openURL('tel:112');
    }
};
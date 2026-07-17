import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export const checkLocatioEnabled =  async () => {
    try {
        const isEnabled = await Location.hasServicesEnabledAsync();
        if (!isEnabled) {
            Alert.alert(
                'Location Services Disabled',
                'Please enable location services to use this feature.',
                [{ text: 'OK' }]
            );
        }

        return isEnabled;

    } catch (error) {
        console.log('Error checking location services:', error);
        return false;
    }
}

export const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert(
            'Permission Denied',
            'Location permission is required to use this feature.',
            [{ text: 'OK' }]
        );
        return false;
    }
    return true;
}

export const getCurrentLocation = async () => {
    const isEnabled = await checkLocatioEnabled();
    if (!isEnabled) return null;

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
    });

    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
    }
}
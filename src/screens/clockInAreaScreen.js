import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, ActivityIndicator, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Circle, Marker } from "react-native-maps";
import Colors from "../styles/color";
import Avatar from "../components/avatar";
import HeaderWithBackButton from "../components/headerWithBackButton";
import { getCurrentLocation } from "../utils/locationServices";
import { useAttendanceStore } from "../../store";
import { useAuth } from "../contexts/authContext";

const { width, height } = Dimensions.get("window");

const CLOCK_IN_AREA = {
  latitude: 10.870325,
  longitude: 106.803575,
  radius: 200,
};

const ALLOWED_AREA = {
  latMin: 10.869093,
  latMax: 10.871556,
  lngMin: 106.802012,
  lngMax: 106.805138
};


const validateLocation = (lat, lng) => {
  return lat >= ALLOWED_AREA.latMin && lat <= ALLOWED_AREA.latMax &&
         lng >= ALLOWED_AREA.lngMin && lng <= ALLOWED_AREA.lngMax;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const ClockInAreaScreen = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isInArea, setIsInArea] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [distance, setDistance] = useState(null);

  const { clockIn, clockOut, isLoading } = useAttendanceStore();
  const { user } = useAuth();

  const avatarUrl = user.profile?.avatar || null;

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const location = await getCurrentLocation();
      
      if (location) {
        setUserLocation(location);
        const isValid = validateLocation(location.latitude, location.longitude);
        
        const dist = calculateDistance(
          location.latitude,
          location.longitude,
          CLOCK_IN_AREA.latitude,
          CLOCK_IN_AREA.longitude
        );
        
        setDistance(Math.round(dist));
        setIsInArea(isValid);
      } else {
        Alert.alert("Error", "Unable to get your location. Please try again.");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get location. Please check your GPS settings.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleClockIn = async () => {
    if (!isInArea) {
      Alert.alert(
        "Out of Range",
        `You are outside the allowed clock-in area. Please move to the office location to clock in.`
      );
      return;
    }

    if (!userLocation) {
      Alert.alert("Error", "Location not available");
      return;
    }

    try {
      await clockIn({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      });
      
      Alert.alert(
        "Success",
        "You have successfully clocked in!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Clock In Failed",
        error?.message || "Unable to clock in. Please try again."
      );
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  const locationString = userLocation 
    ? `Lat ${userLocation.latitude.toFixed(4)} Long ${userLocation.longitude.toFixed(4)}`
    : "Getting location...";

  return (
    <SafeAreaView style={styles.container}>
      <HeaderWithBackButton title="Clock In Area" onBackPress={() => navigation.goBack()} />
      <ScrollView style={styles.containerWrapper}>
      <View style={styles.mapContainer}>
        {isLoadingLocation ? (
          <View style={styles.loadingMap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation?.latitude || CLOCK_IN_AREA.latitude,
              longitude: userLocation?.longitude || CLOCK_IN_AREA.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Circle
              center={{
                latitude: CLOCK_IN_AREA.latitude,
                longitude: CLOCK_IN_AREA.longitude,
              }}
              radius={CLOCK_IN_AREA.radius}
              fillColor="rgba(147, 112, 255, 0.2)"
              strokeColor="rgba(147, 112, 255, 0.5)"
              strokeWidth={2}
            />

            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
              >
                <View style={styles.userMarker}>
                  <View style={styles.userMarkerInner} />
                </View>
              </Marker>
            )}
          </MapView>
        )}

        {!isLoadingLocation && (
          <View style={[
            styles.notification,
            !isInArea && styles.notificationError
          ]}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>
                {isInArea 
                  ? "You are in the clock-in area!" 
                  : "You are outside the clock-in area"
                }
              </Text>
              <Text style={styles.notificationSubtitle}>
                {isInArea 
                  ? "Now you can clock in" 
                  : "Please move to the office location"
                }
              </Text>
            </View>
          </View>
        )}
      </View>


      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY PROFILE</Text>
          <View style={styles.profileCard}>
            <Avatar url={avatarUrl} name={user._id} width={60} height={60} />
            <View style={styles.profileInfo}>
              <View style={styles.profileRow}>
                <Text style={styles.profileName}>{user?.profile?.fullName || user?.email}</Text>
              </View>
              <Text style={styles.profileDate}>{currentDate}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationText}>{locationString}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCHEDULE</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>CLOCK IN</Text>
              <Text style={styles.scheduleTime}>09:00</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>CLOCK OUT</Text>
              <Text style={styles.scheduleTime}>17:00</Text>
            </View>
          </View>
        </View>     */}

        <TouchableOpacity
          style={[
            styles.clockInButton,
            (!isInArea || isLoading || isLoadingLocation) && styles.clockInButtonDisabled,
          ]}
          onPress={handleClockIn}
          disabled={!isInArea || isLoading || isLoadingLocation}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.clockInButtonText}>Clock-in</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClockInAreaScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  containerWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#000000",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  mapContainer: {
    height: height * 0.4,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  userMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(147, 112, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  notification: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationError: {
    backgroundColor: "#FF6B6B",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666666",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2D2D",
    marginRight: 6,
  },
  profileDate: {
    fontSize: 13,
    color:  Colors.primary,
    fontWeight: "bold",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#999999",
  },
  scheduleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleItem: {
    flex: 1,
    alignItems: "center",
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scheduleTime: {
    fontSize: 25,
    fontWeight: "500",
    color: "#000000",
  },
  scheduleDivider: {
    width: 1.5,
    height: 45,
    backgroundColor: "#E8E8E8",
    marginHorizontal: 20,
  },
  clockInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clockInButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0.1,
  },
  clockInButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});


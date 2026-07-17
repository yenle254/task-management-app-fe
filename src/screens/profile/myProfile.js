import { useNavigation } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ClickChange from "../../components/profile/clickChange";
import ViewInf from "../../components/profile/viewInf";
import Colors from "../../styles/color";
import Avatar from "../../components/avatar";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Back from "../../../assets/icons/back.svg";
import Folder from "../../../assets/icons/folder.svg";
import Location from "../../../assets/icons/location-tick.svg";
import LogoutIcon from "../../../assets/icons/logout.svg";
import Faq from "../../../assets/icons/message-text.svg";
import Payroll from "../../../assets/icons/money.svg";
import Code from "../../../assets/icons/scroll.svg";
import Key from "../../../assets/icons/setting-2.svg";
import Mail from "../../../assets/icons/sms.svg";
import Person from "../../../assets/icons/user.svg";

import { useAuth } from "@/src/contexts/authContext";

const AVATAR_SIZE = 90;
const HEADER_BASE_HEIGHT = 120;

const MyProfile = () => {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const insets = useSafeAreaInsets();

  const profileData = {
    name: user?.profile?.fullName || user?.name || "Username",
    position: user?.profile?.position || "Position",
    email: user?.email || "gg@gmail.com",
    location: user?.profile?.department || "Department",
  };

  // Avatar logic - giống userHeader
  const avatarUrl = user?.profile?.avatar || null;
  const avatarKey = "avt1";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => await signOut(),
      },
    ]);
  };

  const layoutConfig = useMemo(() => {
    const headerTotalHeight = HEADER_BASE_HEIGHT + insets.top;
    const avatarTop = headerTotalHeight - AVATAR_SIZE / 2;
    const scrollPaddingTop = AVATAR_SIZE / 2 + 20;

    return {
      headerTotalHeight,
      avatarTop,
      scrollPaddingTop,
    };
  }, [insets.top]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.header,
          {
            height: layoutConfig.headerTotalHeight,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Back width={24} height={24} fill="white" />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar - sử dụng component Avatar */}
      <View
        style={[
          styles.avatarContainer,
          {
            top: layoutConfig.avatarTop,
          },
        ]}
      >
        <Avatar
          url={avatarUrl}
          name={avatarKey}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          style={styles.avatarStyle}
        />
      </View>

      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profileData.name}</Text>
          <Text style={styles.position}>{profileData.position}</Text>
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* CONTACT */}
          <Text style={styles.sectionHeader}>CONTACT</Text>
          <View style={styles.section}>
            <ViewInf
              icon={<Mail width={20} height={20} style={styles.inputIcon} />}
              title={profileData.email}
            />
            <ViewInf
              icon={
                <Location width={20} height={20} style={styles.inputIcon} />
              }
              title={profileData.location}
            />
          </View>

          {/* ACCOUNT */}
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.section}>
            <ClickChange
              icon={<Person width={20} height={20} style={styles.inputIcon} />}
              title="Personal Data"
              onPress={() => navigation.navigate("PersonalData")}
            />
            <ClickChange
              icon={<Folder width={20} height={20} style={styles.inputIcon} />}
              title="Office Assets"
              onPress={() => navigation.navigate("OfficeAssets")}
            />
            <ClickChange
              icon={<Payroll width={20} height={20} style={styles.inputIcon} />}
              title="Payroll & Tax"
              onPress={() => navigation.navigate("PayrollAndTax")}
            />
          </View>

          {/* SETTINGS */}
          <Text style={styles.sectionHeader}>SETTINGS</Text>
          <View style={styles.section}>
            <ClickChange
              icon={<Key width={20} height={20} style={styles.inputIcon} />}
              title="Change Password"
              onPress={() => navigation.navigate("ChangePassword")}
            />
            <ClickChange
              icon={<Code width={20} height={20} style={styles.inputIcon} />}
              title="Versioning"
              onPress={() => {}}
            />
            <ClickChange
              icon={<Faq width={20} height={20} style={styles.inputIcon} />}
              title="FAQ and Help"
              onPress={() => {}}
            />
            <ClickChange
              icon={
                <LogoutIcon
                  width={20}
                  height={20}
                  style={[styles.inputIcon, { tintColor: "#FF3B30" }]}
                />
              }
              title="Logout"
              onPress={handleLogout}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default MyProfile;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    paddingBottom: 70,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    flex: 1,
    paddingBottom: 70,
    textAlign: "center",
    alignContent: "center",
    alignItems: "center",
  },
  // Avatar container để position absolute
  avatarContainer: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
  },
  avatarStyle: {
    borderWidth: 2,
    borderColor: "#F5F5F5",
    backgroundColor: Colors.white,
    borderRadius: 45,
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 48,
  },
  position: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  section: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
    tintColor: Colors.primary || "#6B4EFF",
  },
});

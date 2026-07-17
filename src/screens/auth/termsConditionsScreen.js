import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../styles/color";
import AppButton from "../../components/appButton";
import Back from "../../../assets/icons/back.svg";

const TermsConditionsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Back width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.title}>
          Terms & Conditions and{"\n"}Privacy Policy
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms and Conditions</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Acceptance:</Text> By using the Re-Dus
            app, you agree to comply with all applicable laws and regulations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Usage:</Text> This app is for personal
            use only and may not be used for commercial purposes without
            permission.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Account:</Text> You are responsible
            for the security of your account and all activities that occur
            within it.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Content:</Text> You must not upload
            content that violates copyright, trademark, or other intellectual
            property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Changes:</Text> We reserve the right
            to change the terms and conditions at any time and will notify you
            of changes through the app or via email.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy:</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Data Collection:</Text> We collect
            personal data such as name, email, and location to provide
            transactions and improve our services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Data Usage:</Text> Your data will be
            used for purposes such as account management, usage analysis, and
            service offerings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Security:</Text> We protect your data
            with appropriate security measures to prevent unauthorized access.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Data Sharing:</Text> We do not share
            your personal data with third parties without your consent, except
            as required by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionText}>
            <Text style={styles.boldText}>Your Rights:</Text> You can access,
            update, or delete your personal data at any time by contacting us.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          text="I Agree"
          onPress={() => navigation.goBack()}
          style={styles.agreeButton}
          textStyle={styles.agreeButtonText}
        />

        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.black,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.black,
    textAlign: "center",
    lineHeight: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.black,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "600",
    color: Colors.black,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  agreeButton: {
    width: "100%",
    height: 48,
    borderRadius: 100,
    marginBottom: 12,
  },
  agreeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  declineButton: {
    width: "100%",
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
  },
});

export default TermsConditionsScreen;

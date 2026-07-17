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

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Back width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            We collect personal data such as name, email address, phone number,
            and location to provide our services and improve user experience.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. How We Use Your Information
          </Text>
          <Text style={styles.sectionText}>
            Your data will be used for purposes such as:
          </Text>
          <Text style={styles.bulletText}>
            • Account management and authentication
          </Text>
          <Text style={styles.bulletText}>
            • Service improvements and personalization
          </Text>
          <Text style={styles.bulletText}>• Usage analysis and statistics</Text>
          <Text style={styles.bulletText}>
            • Customer support and communication
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.sectionText}>
            We protect your data with appropriate security measures including
            encryption, secure servers, and access controls to prevent
            unauthorized access.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.sectionText}>
            We do not share your personal data with third parties without your
            consent, except:
          </Text>
          <Text style={styles.bulletText}>
            • When required by law or legal process
          </Text>
          <Text style={styles.bulletText}>
            • To protect our rights and property
          </Text>
          <Text style={styles.bulletText}>• With your explicit permission</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.sectionText}>You have the right to:</Text>
          <Text style={styles.bulletText}>• Access your personal data</Text>
          <Text style={styles.bulletText}>
            • Update or correct your information
          </Text>
          <Text style={styles.bulletText}>• Delete your account and data</Text>
          <Text style={styles.bulletText}>
            • Opt-out of marketing communications
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
          <Text style={styles.sectionText}>
            We use cookies and similar technologies to enhance your experience,
            analyze usage patterns, and provide personalized content.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We reserve the right to update this privacy policy at any time. We
            will notify you of any changes through the app or via email.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions about this privacy policy or how we handle
            your data, please contact us at:
          </Text>
          <Text style={styles.contactText}>Email: support@workmate.com</Text>
          <Text style={styles.contactText}>Phone: +62 123 456 7890</Text>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated: November 5, 2025
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
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
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 22,
    marginLeft: 8,
  },
  lastUpdated: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
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

export default PrivacyPolicyScreen;

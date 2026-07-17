import React, { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slide from "../../components/auth/onboarding/slide";
import OnboardingFooter from "../../components/auth/onboarding/onboardingFooter";
import { useAuth } from "../../contexts/authContext";
import Colors from "../../styles/color";

const { width } = Dimensions.get("window"); 

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Workmate!",
    description:
      "Make Smart Decisions! Set clear timelines for projects and celebrate your achievements!",
  },
  {
    id: 2,
    title: "Manage Stress Effectively",
    description:
      "Stay Balanced! Track your workload and maintain a healthy stress level with ease.",
  },
  {
    id: 3,
    title: "Plan for Success",
    description:
      "Your Journey Starts Here! Earn achievement badges as you conquer your tasks. Let's get started!",
  },
  {
    id: 4,
    title: "Navigate Your Work Journey Efficient & Easy",
    description:
      "Increase your work management & career & development radically",
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const { completeOnboarding } = useAuth();

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const renderItem = ({ item }) => <Slide item={item} />;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          scrollEnabled={false}
        />

        <OnboardingFooter
          currentIndex={currentIndex}
          totalSlides={onboardingData.length}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
});

export default OnboardingScreen;

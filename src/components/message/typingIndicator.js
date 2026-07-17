import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Colors from "../../styles/color";


const TypingIndicator = ({userName}) => {
  const dotAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const opacity = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1, 0.5],
  });

  return (
    <View style={styles.typingContainer}>
      <Text style={styles.text}>{userName} is typing</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity }]} />
        <Animated.View style={[styles.dot, { opacity }]} />
        <Animated.View style={[styles.dot, { opacity }]} />
      </View>
    </View>
  )
}

export default TypingIndicator;

const styles = StyleSheet.create({
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
  },
});
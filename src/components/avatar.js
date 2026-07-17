import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { AvatarMap, DefaultAvatar } from "../utils/avatarMapping";

const Avatar = ({ name, url, width = 54, height = 54, style }) => {
  if (
    url &&
    typeof url === "string" &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("file://") ||
      url.startsWith("content://"))
  ) {
    return (
      <View
        style={[
          styles.container,
          { width, height, borderRadius: width / 2 },
          style,
        ]}
      >
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => console.log("Avatar load failed:", url)}
        />
      </View>
    );
  }

  const SvgComponent = AvatarMap[name] || DefaultAvatar;

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius: width / 2 },
        style,
      ]}
    >
      <SvgComponent width={width} height={height} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default Avatar;

import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AvatarMap, DefaultAvatar } from "../utils/avatarMapping";
import { useAuth } from "../contexts/authContext";
import { getPreviewUrl, releasePreview } from "../services/fileService";
import { resolveAvatar } from "../utils/avatarData";

const Avatar = ({ userId, name, url, width = 54, height = 54, style }) => {
  const { user } = useAuth();
  const resolved = resolveAvatar({ userId, name, url }, user);
  const [preview, setPreview] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let ownedPreview;
    setPreview(null);
    setFailed(false);
    if (resolved.url) {
      getPreviewUrl(resolved.url).then(uri => {
        ownedPreview = uri;
        if (active) setPreview({ url: resolved.url, uri });
        else releasePreview(uri).catch(() => {});
      }).catch(() => { if (active) setFailed(true); });
    }
    return () => {
      active = false;
      if (ownedPreview) releasePreview(ownedPreview).catch(() => {});
    };
  }, [resolved.url, user?._id]);
  const SvgComponent = AvatarMap[resolved.name] || DefaultAvatar;
  const uri = preview?.url === resolved.url ? preview.uri : null;
  return (
    <View style={[styles.container, { width, height, borderRadius: width / 2 }, style]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />
      ) : resolved.name && !AvatarMap[resolved.name] ? (
        <Text style={{ color: '#7057FC', fontSize: width * 0.4, fontWeight: '600' }}>{String(resolved.name).charAt(0).toUpperCase()}</Text>
      ) : <SvgComponent width={width} height={height} />}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { overflow: "hidden", backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: "100%" },
});
export default Avatar;

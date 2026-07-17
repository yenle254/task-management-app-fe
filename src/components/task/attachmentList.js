import React, { useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageIcon from "../../../assets/icons/sms.svg";
import PdfIcon from "../../../assets/icons/todo.svg";
import DownloadIcon from "../../../assets/icons/user.svg";
import Colors from "../../styles/color";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AttachmentList = ({ attachments = [] }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isImage = (att) => {
    if (!att?.url) return false;
    const url = att.url.toLowerCase();
    const type = (att.type || "").toLowerCase();
    return (
      type.includes("image") ||
      /\.(jpe?g|png|gif|webp)$/i.test(url)
    );
  };

  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  const images = safeAttachments.filter(isImage).slice(0, 5);
  const files = safeAttachments.filter((att) => !isImage(att));  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        if (dx > 50 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        } else if (dx < -50 && currentIndex < images.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      },
    })
  ).current;

  const openImageModal = (index) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const goPrev = () => currentIndex > 0 && setCurrentIndex(currentIndex - 1);
  const goNext = () =>
    currentIndex < images.length - 1 && setCurrentIndex(currentIndex + 1);

  const handleOpenFile = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "Cannot open this file");
    } catch {
      Alert.alert("Error", "Failed to open file");
    }
  };

  if (safeAttachments.length === 0) return null;

  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={() => openImageModal(0)}>
            <Image
              source={{ uri: images[0].url }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailScroll}
            >
              {images.slice(1).map((att, i) => {
                const idx = i + 1;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => openImageModal(idx)}
                    style={styles.thumbnailWrapper}
                  >
                    <Image source={{ uri: att.url }} style={styles.thumbnail} />
                    {idx === 4 && images.length > 5 && (
                      <View style={styles.moreOverlay}>
                        <Text style={styles.moreText}>
                          +{images.length - 5}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {files.length > 0 && (
        <View style={styles.fileSection}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          {files.map((att, i) => {
            const isPdf =
              (att.type || "").toLowerCase().includes("pdf") ||
              att.url?.toLowerCase().endsWith(".pdf");
            const ext = att.url?.split(".").pop()?.toUpperCase() || "FILE";

            return (
              <TouchableOpacity
                key={i}
                style={styles.fileItem}
                onPress={() => handleOpenFile(att.url)}
              >
                <View style={styles.fileInfo}>
                  {isPdf ? (
                    <PdfIcon width={24} height={24} fill="#666" />
                  ) : (
                    <ImageIcon width={24} height={24} fill="#666" />
                  )}
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {att.name || "Unknown file"}
                    </Text>
                    <Text style={styles.fileType}>{ext}</Text>
                  </View>
                </View>
                <DownloadIcon width={20} height={20} fill="#666" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <View style={styles.imageContainer} {...panResponder.panHandlers}>
            <Image
              source={{ uri: images[currentIndex]?.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>

          {currentIndex > 0 && (
            <TouchableOpacity style={styles.navButtonLeft} onPress={goPrev}>
              <Text style={styles.navArrow}>{"<"}</Text>
            </TouchableOpacity>
          )}
          {currentIndex < images.length - 1 && (
            <TouchableOpacity style={styles.navButtonRight} onPress={goNext}>
              <Text style={styles.navArrow}>{">"}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttachmentList;

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.white, marginTop: 8 },
  imageSection: { padding: 16 },
  mainImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
  },
  thumbnailScroll: { flexDirection: "row" },
  thumbnailWrapper: { position: "relative", marginRight: 8 },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  moreText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  fileSection: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 12 },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  fileInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  fileDetails: { marginLeft: 12, flex: 1 },
  fileName: { fontSize: 14, fontWeight: "600", color: "#000" },
  fileType: { fontSize: 12, color: "#666", marginTop: 2 },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { color: "#FFF", fontSize: 28, fontWeight: "bold" },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "100%",
  },
  navButtonLeft: {
    position: "absolute",
    left: 20,
    top: "50%",
    marginTop: -30,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 50,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navButtonRight: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -30,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 50,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navArrow: { color: "#FFF", fontSize: 28, fontWeight: "bold" },
  counter: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
});
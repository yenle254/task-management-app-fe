import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Text, Image, Alert} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Colors from "../../styles/color";
import { downloadFile } from "../../utils/downloadHelper";

const { width, height } = Dimensions.get("window");

const ImageViewerScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { images, initialIndex = 0 } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!images || images.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerClose}>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No images to display</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const url = currentImage;
      const filename = `image_${Date.now()}.jpg`;
      await downloadFile(url, filename);
      setIsDownloading(false);
    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
      Alert.alert('Download Error', 'Failed to download image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerClose}>
      </View>
      <View style={styles.imageContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        <Image
          source={{ uri: currentImage }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </View>

      <View style={styles.downloadButtonContainer}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}
          disabled={isDownloading}
        >
          <Text style={styles.downloadButtonText}>
            {isDownloading ? 'Downloading...' : 'Download'}
          </Text>
        </TouchableOpacity>
      </View>

      {images.length > 1 && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonText}>Previous</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentIndex === images.length - 1 && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={currentIndex === images.length - 1}
          >
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonText}>Next</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerClose: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginBottom: 30,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#999",
    opacity: 0.5,
  },
  navButtonContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  counter: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
  },
  downloadButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ImageViewerScreen;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { BilingualText } from '../src/components/BilingualText';
import { translations } from '../src/constants/translations';
import { analyzePlant } from '../src/services/plantService';

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });
        if (photo?.base64) {
          setCapturedImage(photo.base64);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.3,
      });

      if (!result.canceled && result.assets[0].base64) {
        setCapturedImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      // Get location for weather data
      let latitude: number | undefined;
      let longitude: number | undefined;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (locError) {
        console.log('Location not available:', locError);
      }

      // Analyze plant
      const result = await analyzePlant(capturedImage, latitude, longitude);

      // Navigate to results
      router.replace({
        pathname: '/result',
        params: { scanData: JSON.stringify(result) },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the image. Please try again with a clearer photo of the plant leaf.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const goBack = () => {
    router.back();
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={colors.textTertiary} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Camera permission is required
          </Text>
          <Text style={[styles.permissionTextKin, { color: colors.textSecondary }]}>
            Uruhushya rwa kamera rurakenewe
          </Text>
          <Button
            title="Grant Permission / Tanga Uruhushya"
            onPress={requestPermission}
            colors={colors}
            style={{ marginTop: Spacing.xl }}
          />
          <Button
            title="Go Back / Subira Inyuma"
            onPress={goBack}
            variant="outline"
            colors={colors}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </View>
    );
  }

  // Image Preview State
  if (capturedImage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={retakePhoto} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.white }]}>Review Photo</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Image Preview */}
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${capturedImage}` }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {/* Analyzing Overlay */}
        {isAnalyzing && (
          <View style={styles.analyzingOverlay}>
            <View style={[styles.analyzingBox, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <BilingualText
                english={translations.analyzing.en}
                kinyarwanda={translations.analyzing.kin}
                primaryColor={colors.text}
                secondaryColor={colors.textSecondary}
                inline={false}
                style={styles.analyzingText}
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Button
            title="Retake / Ongera ufate"
            onPress={retakePhoto}
            variant="outline"
            colors={colors}
            style={styles.actionButton}
            disabled={isAnalyzing}
          />
          <Button
            title="Analyze / Suzuma"
            onPress={analyzeImage}
            colors={colors}
            style={styles.actionButton}
            loading={isAnalyzing}
            icon={<Ionicons name="scan" size={20} color={colors.white} />}
          />
        </View>
      </View>
    );
  }

  // Camera View State
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Header */}
        <View style={[styles.cameraHeader, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={goBack} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <BilingualText
            english={translations.scan.en}
            kinyarwanda={translations.scan.kin}
            primaryColor="#FFF"
            secondaryColor="rgba(255,255,255,0.7)"
            englishStyle={styles.cameraTitle}
          />
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <Ionicons name="camera-reverse" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Guide Frame */}
        <View style={styles.guideContainer}>
          <View style={styles.guideFrame}>
            <View style={[styles.guideCorner, styles.topLeft]} />
            <View style={[styles.guideCorner, styles.topRight]} />
            <View style={[styles.guideCorner, styles.bottomLeft]} />
            <View style={[styles.guideCorner, styles.bottomRight]} />
          </View>
          <Text style={styles.guideText}>
            {translations.pointCamera.en}
          </Text>
          <Text style={styles.guideTextKin}>
            {translations.pointCamera.kin}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.cameraControls, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={styles.galleryButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  permissionText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  permissionTextKin: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  guideCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  guideText: {
    color: '#FFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  guideTextKin: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  // Preview styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingBox: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: '#000',
  },
  actionButton: {
    flex: 1,
  },
});

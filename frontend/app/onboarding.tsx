import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/components/ThemeContext';
import { Typography, Spacing } from '../src/constants/theme';
import { Button } from '../src/components/Button';


const ONBOARDING_KEY = '@plant_doctor_onboarding';

interface OnboardingSlide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  titleKin: string;
  description: string;
  descriptionKin: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: 'camera',
    title: 'Scan Your Plants',
    titleKin: 'Suzuma Ibihingwa Byawe',
    description: 'Take a photo of your plant leaf to identify diseases and get treatment recommendations.',
    descriptionKin: 'Fata ifoto y\'ikijambo cy\'igihingwa cyawe kugira ngo umenye indwara no kubona inama z\'imiti.',
  },
  {
    icon: 'medkit',
    title: 'Get Treatment Advice',
    titleKin: 'Kubona Inama z\'Imiti',
    description: 'Receive detailed treatment plans with specific dosages for your farming needs.',
    descriptionKin: 'Kubona gahunda y\'imiti yuzuye n\'ingano y\'imiti ku bikorwa by\'ubuhinzi bwawe.',
  },
  {
    icon: 'leaf',
    title: 'Track Your Garden',
    titleKin: 'Kurikirana Ubusitani Bwawe',
    description: 'Save your plants and monitor their health over time.',
    descriptionKin: 'Bika ibihingwa byawe kandi ukurikirane ubuzima bwabyo uko ibihe bigenda.',
  },
  {
    icon: 'people',
    title: 'Join the Community',
    titleKin: 'Injira mu Muryango',
    description: 'Share experiences and learn from other farmers in your area.',
    descriptionKin: 'Sangiza ubunararibonye kandi wige ku bandi bahinzi bo mu karere kawe.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/(tabs)');
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          Skip / Simbuka
        </Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name={currentSlide.icon} size={80} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {currentSlide.title}
        </Text>
        <Text style={[styles.titleKin, { color: colors.textSecondary }]}>
          {currentSlide.titleKin}
        </Text>

        <Text style={[styles.description, { color: colors.text }]}>
          {currentSlide.description}
        </Text>
        <Text style={[styles.descriptionKin, { color: colors.textSecondary }]}>
          {currentSlide.descriptionKin}
        </Text>
      </View>

      {/* Pagination */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? colors.primary : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={
            currentIndex < slides.length - 1
              ? 'Next / Komeza'
              : 'Get Started / Tangira'
          }
          onPress={handleNext}
          colors={colors}
          size="large"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: Typography.sizes.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  titleKin: {
    fontSize: Typography.sizes.lg,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  descriptionKin: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingBottom: Spacing.xxxl,
  },
  button: {
    width: '100%',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/components/ThemeContext';
import { Typography, Spacing } from '../src/constants/theme';

const ONBOARDING_KEY = '@agro_reba_onboarding';

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Animate splash
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check onboarding and navigate
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const hasOnboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
      
      // Wait for animation
      setTimeout(() => {
        if (hasOnboarded) {
          // Every cold start: show professional loading screen first
          router.replace('/loading');
        } else {
          router.replace('/onboarding');
        }
      }, 2000);
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setTimeout(() => router.replace('/loading'), 2000);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={80} color={colors.white} />
        </View>
        <Text style={[styles.title, { color: colors.white }]}>
          AgroReba
        </Text>
        <Text style={[styles.subtitle, { color: colors.white + 'CC' }]}>
          AgroReba
        </Text>
        <Text style={[styles.tagline, { color: colors.white + '99' }]}>
          Helping farmers grow healthier crops
        </Text>
        <Text style={[styles.taglineKin, { color: colors.white + '99' }]}>
          Dufasha abahinzi gukura ibihingwa bizima
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.xl,
    fontStyle: 'italic',
    marginBottom: Spacing.xl,
  },
  tagline: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  taglineKin: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});

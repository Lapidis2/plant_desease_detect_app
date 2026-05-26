import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/components/ThemeContext';
import { Typography, Spacing } from '../src/constants/theme';

export default function LoadingScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const progress = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const [progressPercent, setProgressPercent] = React.useState(0);

  useEffect(() => {
    // Professional slower rotation (more elegant)
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animate progress from 0 to 100% (snappier professional duration)
    Animated.timing(progress, {
      toValue: 100,
      duration: 2400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        // Subtle haptic + nice scale pop on the logo for satisfying finish
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.08,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();

        // Short polish delay then go to main app
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 280);
      }
    });

    // Update percentage text smoothly
    const listener = progress.addListener(({ value }) => {
      setProgressPercent(Math.floor(value));
    });

    return () => {
      progress.removeListener(listener);
    };
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.content}>
        {/* Spinning Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ rotate: spin }, { scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/app-logo.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name */}
        <Text style={[styles.title, { color: colors.white }]}>SOROMA TECH LTD</Text>
        <Text style={[styles.subtitle, { color: colors.white + 'CC' }]}>
          Setting up your farm tools
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                  backgroundColor: '#ffffff',
                },
              ]}
            />
          </View>
        </View>

        {/* Percentage */}
        <Text style={[styles.percentage, { color: colors.white }]}>
          {progressPercent}%
        </Text>

        <Text style={[styles.loadingText, { color: colors.white + '99' }]}>
          Loading your personalized Agri experience...
        </Text>
      </View>
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
    width: '80%',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    marginBottom: Spacing.xxl,
  },
  progressContainer: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  progressBackground: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
});

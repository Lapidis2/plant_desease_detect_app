import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { BorderRadius } from '../constants/theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  baseColor?: string;
  highlightColor?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
  baseColor = '#E0E5E0',
  highlightColor = '#F0F4F0',
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC<{ baseColor?: string; highlightColor?: string }> = ({
  baseColor,
  highlightColor,
}) => (
  <View style={styles.card}>
    <LoadingSkeleton
      width={80}
      height={80}
      borderRadius={BorderRadius.md}
      baseColor={baseColor}
      highlightColor={highlightColor}
    />
    <View style={styles.cardContent}>
      <LoadingSkeleton
        width="80%"
        height={18}
        baseColor={baseColor}
        highlightColor={highlightColor}
      />
      <LoadingSkeleton
        width="60%"
        height={14}
        style={{ marginTop: 8 }}
        baseColor={baseColor}
        highlightColor={highlightColor}
      />
      <LoadingSkeleton
        width="40%"
        height={14}
        style={{ marginTop: 8 }}
        baseColor={baseColor}
        highlightColor={highlightColor}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
});

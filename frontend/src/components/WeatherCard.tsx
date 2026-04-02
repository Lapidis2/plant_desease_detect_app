import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ThemeColors } from '../constants/theme';
import { BilingualText } from './BilingualText';
import { WeatherData } from '../store/appSlice';

interface WeatherCardProps {
  weather: WeatherData;
  colors: ThemeColors;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, colors }) => {
  const getWeatherIcon = (description: string): keyof typeof Ionicons.glyphMap => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) return 'sunny';
    if (desc.includes('cloud')) return 'cloudy';
    if (desc.includes('rain') || desc.includes('drizzle')) return 'rainy';
    if (desc.includes('fog')) return 'cloud';
    return 'partly-sunny';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name={getWeatherIcon(weather.description)} size={40} color={colors.primary} />
        <View style={styles.tempContainer}>
          <Text style={[styles.temperature, { color: colors.text }]}>
            {Math.round(weather.temperature)}°C
          </Text>
          <Text style={[styles.humidity, { color: colors.textSecondary }]}>
            Humidity: {weather.humidity}%
          </Text>
        </View>
      </View>

      <BilingualText
        english={weather.description}
        kinyarwanda={weather.description_kinyarwanda}
        primaryColor={colors.text}
        secondaryColor={colors.textSecondary}
        style={styles.description}
      />

      <View style={[styles.adviceContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <View style={styles.adviceContent}>
          <Text style={[styles.adviceLabel, { color: colors.textSecondary }]}>
            Farming Advice / Inama z'Ubuhinzi
          </Text>
          <BilingualText
            english={weather.farming_advice}
            kinyarwanda={weather.farming_advice_kinyarwanda}
            primaryColor={colors.text}
            secondaryColor={colors.textSecondary}
            inline={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tempContainer: {
    marginLeft: Spacing.md,
  },
  temperature: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
  },
  humidity: {
    fontSize: Typography.sizes.sm,
  },
  description: {
    marginBottom: Spacing.md,
  },
  adviceContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  adviceContent: {
    flex: 1,
  },
  adviceLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
});

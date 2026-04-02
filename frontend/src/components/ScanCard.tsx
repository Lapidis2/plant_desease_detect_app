import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ThemeColors } from '../constants/theme';
import { BilingualText } from './BilingualText';
import { ScanResult } from '../store/appSlice';
import { getHealthColor, formatRelativeDate } from '../utils/helpers';

interface ScanCardProps {
  scan: ScanResult;
  onPress: () => void;
  colors: ThemeColors;
  compact?: boolean;
}

export const ScanCard: React.FC<ScanCardProps> = ({
  scan,
  onPress,
  colors,
  compact = false,
}) => {
  const healthColor = getHealthColor(scan.health_score, colors);
  const hasDisease = scan.diseases && scan.diseases.length > 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        compact && styles.compact,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {scan.image_base64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${scan.image_base64.substring(0, 100000)}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="leaf" size={32} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.healthBadge,
            { backgroundColor: healthColor },
          ]}
        >
          <Text style={styles.healthText}>{scan.health_score}%</Text>
        </View>
      </View>

      <View style={styles.content}>
        {scan.plant && (
          <BilingualText
            english={scan.plant.common_name}
            kinyarwanda={scan.plant.common_name_kinyarwanda}
            primaryColor={colors.text}
            secondaryColor={colors.textSecondary}
            style={styles.plantName}
          />
        )}

        {scan.plant && (
          <Text style={[styles.scientificName, { color: colors.textTertiary }]}>
            {scan.plant.scientific_name}
          </Text>
        )}

        <View style={styles.statusRow}>
          {hasDisease ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.statusText, { color: colors.error }]}>
                {scan.diseases.length} issue{scan.diseases.length > 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>Healthy</Text>
            </View>
          )}
        </View>

        <Text style={[styles.date, { color: colors.textTertiary }]}>
          {formatRelativeDate(scan.scan_date)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  compact: {
    padding: Spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  healthText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  content: {
    flex: 1,
  },
  plantName: {
    marginBottom: 2,
  },
  scientificName: {
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  date: {
    fontSize: Typography.sizes.xs,
  },
});

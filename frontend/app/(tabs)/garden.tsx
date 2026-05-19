import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { BilingualText } from '../../src/components/BilingualText';
import { CardSkeleton } from '../../src/components/LoadingSkeleton';
import { translations } from '../../src/constants/translations';
import { getGarden, removePlantFromGarden } from '../../src/services/plantService';
import { GardenPlant } from '../../src/store/appSlice';

export default function GardenScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);

  const loadGarden = useCallback(async () => {
    try {
      const plants = await getGarden();
      setGardenPlants(plants);
    } catch (error) {
      console.error('Error loading garden:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGarden();
  }, [loadGarden]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGarden();
    setRefreshing(false);
  };

  const handleRemovePlant = (plant: GardenPlant) => {
    Alert.alert(
      'Remove Plant / Kuramo Igihingwa',
      `Remove ${plant.plant.common_name} from your garden?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePlantFromGarden(plant.id);
              setGardenPlants(prev => prev.filter(p => p.id !== plant.id));
            } catch (error) {
              console.error('Error removing plant:', error);
              Alert.alert('Error', 'Failed to remove plant.');
            }
          },
        },
      ]
    );
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return colors.success;
      case 'needs_attention':
        return colors.warning;
      case 'unhealthy':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <BilingualText
          english={translations.garden.en}
          kinyarwanda={translations.garden.kin}
          primaryColor={colors.text}
          secondaryColor={colors.textSecondary}
          englishStyle={styles.headerTitle}
        />
        <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>
            {gardenPlants.length} plants
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <>
            <CardSkeleton baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
            <CardSkeleton baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
            <CardSkeleton baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
          </>
        ) : gardenPlants.length > 0 ? (
          gardenPlants.map((gardenPlant) => (
            <View
              key={gardenPlant.id}
              style={[styles.plantCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.cardContent}>
                {gardenPlant.plant.image_base64 ? (
                  <Image
                    source={{
                      uri: gardenPlant.plant.image_base64.startsWith('data:')
                        ? gardenPlant.plant.image_base64
                        : `data:image/jpeg;base64,${gardenPlant.plant.image_base64}`
                    }}
                    style={styles.plantIconImage}
                  />
                ) : (
                  <View style={[styles.plantIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="leaf" size={32} color={colors.primary} />
                  </View>
                )}

                <View style={styles.plantInfo}>
                  <BilingualText
                    english={gardenPlant.plant.common_name}
                    kinyarwanda={gardenPlant.plant.common_name_kinyarwanda}
                    primaryColor={colors.text}
                    secondaryColor={colors.textSecondary}
                    englishStyle={styles.plantName}
                    inline={false}
                  />
                  <Text style={[styles.scientificName, { color: colors.textTertiary }]}>
                    {gardenPlant.plant.scientific_name}
                  </Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getHealthStatusColor(gardenPlant.health_status) },
                      ]}
                    />
                 <Text style={[styles.statusText, { color: colors.textSecondary }]}>
  {(gardenPlant.health_status ?? '').replace('_', ' ')}
</Text>
                  </View>
                </View>
              </View>

              {gardenPlant.notes && (
                <View style={[styles.notesSection, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Notes:</Text>
                  <Text style={[styles.notesText, { color: colors.text }]}>
                    {gardenPlant.notes}
                  </Text>
                </View>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
                  onPress={() => router.push('/scan')}
                >
                  <Ionicons name="scan" size={18} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
                  onPress={() => handleRemovePlant(gardenPlant)}
                >
                  <Ionicons name="trash" size={18} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="leaf-outline" size={64} color={colors.textTertiary} />
            <BilingualText
              english={translations.emptyGarden.en}
              kinyarwanda={translations.emptyGarden.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              style={styles.emptyTitle}
              englishStyle={styles.emptyTitleText}
            />
            <BilingualText
              english={translations.startScanning.en}
              kinyarwanda={translations.startScanning.kin}
              primaryColor={colors.textSecondary}
              secondaryColor={colors.textTertiary}
              inline={false}
              style={styles.emptySubtitle}
            />
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="scan" size={20} color={colors.white} />
              <Text style={[styles.scanButtonText, { color: colors.white }]}>
                Start Scanning / Tangira Gusuzuma
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  countBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  plantCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  plantIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantInfo: {
    flex: 1,
  },
  plantIconImage: {
  width: 64,
  height: 64,
  borderRadius: 12,
  resizeMode: 'cover',
},
  plantName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  scientificName: {
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    textTransform: 'capitalize',
  },
  notesSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  notesLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: Typography.sizes.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  emptyState: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyTitleText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  emptySubtitle: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  scanButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { BilingualText } from '../src/components/BilingualText';
import { DiseaseCard } from '../src/components/DiseaseCard';
import { WeatherCard } from '../src/components/WeatherCard';
import { Button } from '../src/components/Button';
import { translations } from '../src/constants/translations';
import { getHealthColor } from '../src/utils/helpers';
import { ScanResult } from '../src/store/appSlice';
import { addPlantToGarden } from '../src/services/plantService';

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [addingToGarden, setAddingToGarden] = useState(false);

  useEffect(() => {
    if (params.scanData) {
      try {
        const data = JSON.parse(params.scanData as string);
        setScanResult(data);
      } catch (error) {
        console.error('Error parsing scan data:', error);
      }
    }
  }, [params.scanData]);

  const handleAddToGarden = async () => {
    if (!scanResult?.plant) return;

    setAddingToGarden(true);
    try {
      await addPlantToGarden(scanResult.plant);
      Alert.alert(
        'Added to Garden / Yongewe mu Busitani',
        'Plant has been saved to your garden.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding to garden:', error);
      Alert.alert('Error', 'Failed to add plant to garden.');
    } finally {
      setAddingToGarden(false);
    }
  };

  const navigateToDiseaseDetail = (diseaseIndex: number) => {
    if (!scanResult) return;
    router.push({
      pathname: '/disease-detail',
      params: {
        disease: JSON.stringify(scanResult.diseases[diseaseIndex]),
      },
    });
  };

  if (!scanResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  const healthColor = getHealthColor(scanResult.health_score, colors);
  const hasDisease = scanResult.diseases && scanResult.diseases.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <BilingualText
          english="Scan Results"
          kinyarwanda="Ibisubizo by'Isuzuma"
          primaryColor={colors.white}
          secondaryColor={colors.white + 'CC'}
          englishStyle={styles.headerTitle}
        />
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Plant Image & Health Score */}
        <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {scanResult.image_base64 ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${scanResult.image_base64.substring(0, 100000)}` }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="leaf" size={60} color={colors.primary} />
            </View>
          )}

          {/* Health Score Badge */}
          <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
            <Text style={styles.healthScore}>{scanResult.health_score}%</Text>
            <Text style={styles.healthLabel}>Health</Text>
          </View>
        </View>

        {/* Plant Info */}
        {scanResult.plant && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="leaf" size={24} color={colors.primary} />
              <BilingualText
                english={translations.plantIdentified.en}
                kinyarwanda={translations.plantIdentified.kin}
                primaryColor={colors.text}
                secondaryColor={colors.textSecondary}
                englishStyle={styles.sectionTitle}
              />
            </View>

            <BilingualText
              english={scanResult.plant.common_name}
              kinyarwanda={scanResult.plant.common_name_kinyarwanda}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              englishStyle={styles.plantName}
            />

            <Text style={[styles.scientificName, { color: colors.textTertiary }]}>
              {scanResult.plant.scientific_name}
            </Text>

            <Text style={[styles.familyText, { color: colors.textSecondary }]}>
              Family: {scanResult.plant.family}
            </Text>

            <BilingualText
              english={scanResult.plant.description}
              kinyarwanda={scanResult.plant.description_kinyarwanda}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              style={styles.description}
            />

            {/* Care Tips */}
            {scanResult.plant.care_tips.length > 0 && (
              <View style={styles.careTips}>
                <Text style={[styles.careTipsTitle, { color: colors.text }]}>
                  Care Tips / Inama zo Kwita
                </Text>
                {scanResult.plant.care_tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <BilingualText
                      english={tip}
                      kinyarwanda={scanResult.plant?.care_tips_kinyarwanda[index] || tip}
                      primaryColor={colors.text}
                      secondaryColor={colors.textSecondary}
                      inline={false}
                      style={styles.tipText}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Status Section */}
        <View style={[styles.statusSection, { backgroundColor: hasDisease ? colors.error + '10' : colors.success + '10' }]}>
          <Ionicons
            name={hasDisease ? 'alert-circle' : 'checkmark-circle'}
            size={32}
            color={hasDisease ? colors.error : colors.success}
          />
          <View style={styles.statusContent}>
            <BilingualText
              english={hasDisease ? translations.diseaseDetected.en : translations.noDisease.en}
              kinyarwanda={hasDisease ? translations.diseaseDetected.kin : translations.noDisease.kin}
              primaryColor={hasDisease ? colors.error : colors.success}
              secondaryColor={hasDisease ? colors.error + 'CC' : colors.success + 'CC'}
              englishStyle={styles.statusTitle}
            />
            {hasDisease && (
              <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
                {scanResult.diseases.length} issue{scanResult.diseases.length > 1 ? 's' : ''} found
              </Text>
            )}
          </View>
        </View>

        {/* Diseases */}
        {hasDisease && (
          <View style={styles.diseasesSection}>
            <BilingualText
              english="Detected Issues"
              kinyarwanda="Ibibazo Byabonye"
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              englishStyle={styles.sectionTitle}
              style={styles.sectionLabel}
            />
            {scanResult.diseases.map((disease, index) => (
              <TouchableOpacity
                key={disease.id}
                onPress={() => navigateToDiseaseDetail(index)}
                activeOpacity={0.8}
              >
                <DiseaseCard disease={disease} colors={colors} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {scanResult.recommendations && scanResult.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <BilingualText
              english={translations.recommendations.en}
              kinyarwanda={translations.recommendations.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              englishStyle={styles.sectionTitle}
              style={styles.sectionLabel}
            />
            {scanResult.recommendations.map((rec, index) => (
              <View
                key={rec.id}
                style={[styles.recommendationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.priorityBadge, { backgroundColor: rec.priority === 'high' ? colors.error + '20' : rec.priority === 'medium' ? colors.warning + '20' : colors.info + '20' }]}>
                  <Text style={[styles.priorityText, { color: rec.priority === 'high' ? colors.error : rec.priority === 'medium' ? colors.warning : colors.info }]}>
                    {rec.priority.toUpperCase()}
                  </Text>
                </View>
                <BilingualText
                  english={rec.title}
                  kinyarwanda={rec.title_kinyarwanda}
                  primaryColor={colors.text}
                  secondaryColor={colors.textSecondary}
                  inline={false}
                  englishStyle={styles.recTitle}
                />
                <BilingualText
                  english={rec.description}
                  kinyarwanda={rec.description_kinyarwanda}
                  primaryColor={colors.text}
                  secondaryColor={colors.textSecondary}
                  inline={false}
                  style={styles.recDescription}
                />
                {rec.actions.length > 0 && (
                  <View style={styles.actionsList}>
                    {rec.actions.map((action, i) => (
                      <View key={i} style={styles.actionItem}>
                        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                        <BilingualText
                          english={action}
                          kinyarwanda={rec.actions_kinyarwanda[i] || action}
                          primaryColor={colors.text}
                          secondaryColor={colors.textSecondary}
                          inline={false}
                          style={styles.actionText}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Weather */}
        {scanResult.weather_data && (
          <View style={styles.weatherSection}>
            <BilingualText
              english={translations.farmingAdvice.en}
              kinyarwanda={translations.farmingAdvice.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              englishStyle={styles.sectionTitle}
              style={styles.sectionLabel}
            />
            <WeatherCard weather={scanResult.weather_data} colors={colors} />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={`${translations.addToGarden.en} / ${translations.addToGarden.kin}`}
            onPress={handleAddToGarden}
            colors={colors}
            loading={addingToGarden}
            icon={<Ionicons name="add-circle" size={20} color={colors.white} />}
            style={styles.actionButton}
          />
          <Button
            title="New Scan / Isuzuma Rishya"
            onPress={() => router.push('/scan')}
            variant="outline"
            colors={colors}
            icon={<Ionicons name="camera" size={20} color={colors.primary} />}
            style={styles.actionButton}
          />
        </View>
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
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  errorText: {
    fontSize: Typography.sizes.lg,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  imageCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  plantImage: {
    width: '100%',
    height: 220,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  healthScore: {
    color: '#FFF',
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  healthLabel: {
    color: '#FFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  plantName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  scientificName: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  familyText: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  description: {
    marginBottom: Spacing.md,
  },
  careTips: {
    marginTop: Spacing.md,
  },
  careTipsTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tipText: {
    flex: 1,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  statusSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  diseasesSection: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
  },
  recommendationsSection: {
    marginBottom: Spacing.lg,
  },
  recommendationCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  priorityText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  recTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  recDescription: {
    marginTop: Spacing.sm,
  },
  actionsList: {
    marginTop: Spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  actionText: {
    flex: 1,
  },
  weatherSection: {
    marginBottom: Spacing.lg,
  },
  actions: {
    gap: Spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});

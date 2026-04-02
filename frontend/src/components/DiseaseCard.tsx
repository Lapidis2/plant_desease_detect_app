import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, ThemeColors } from '../constants/theme';
import { BilingualText } from './BilingualText';
import { Disease } from '../store/appSlice';
import { getSeverityColor } from '../utils/helpers';
import { translations } from '../constants/translations';

interface DiseaseCardProps {
  disease: Disease;
  colors: ThemeColors;
  expanded?: boolean;
}

export const DiseaseCard: React.FC<DiseaseCardProps> = ({
  disease,
  colors,
  expanded = false,
}) => {
  const severityColor = getSeverityColor(disease.severity, colors);
  const confidencePercent = Math.round(disease.confidence_score * 100);

  const getSeverityLabel = () => {
    switch (disease.severity) {
      case 'mild':
        return `${translations.mild.en} / ${translations.mild.kin}`;
      case 'moderate':
        return `${translations.moderate.en} / ${translations.moderate.kin}`;
      case 'severe':
        return `${translations.severe.en} / ${translations.severe.kin}`;
      default:
        return disease.severity;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bug" size={24} color={severityColor} />
          <View style={styles.titleContent}>
            <BilingualText
              english={disease.name}
              kinyarwanda={disease.name_kinyarwanda}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              englishStyle={styles.diseaseName}
            />
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: severityColor + '20' }]}>
            <Text style={[styles.badgeText, { color: severityColor }]}>
              {getSeverityLabel()}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.info + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.info }]}>
              {confidencePercent}% {translations.confidence.en}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <BilingualText
        english={disease.description}
        kinyarwanda={disease.description_kinyarwanda}
        primaryColor={colors.text}
        secondaryColor={colors.textSecondary}
        inline={false}
        style={styles.description}
      />

      {expanded && (
        <>
          {/* Causes */}
          {disease.causes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {translations.causes.en} / {translations.causes.kin}
              </Text>
              {disease.causes.map((cause, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="ellipse" size={6} color={colors.textSecondary} />
                  <BilingualText
                    english={cause}
                    kinyarwanda={disease.causes_kinyarwanda[index] || cause}
                    primaryColor={colors.text}
                    secondaryColor={colors.textSecondary}
                    inline={false}
                    style={styles.listText}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Symptoms */}
          {disease.symptoms.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {translations.symptoms.en} / {translations.symptoms.kin}
              </Text>
              {disease.symptoms.map((symptom, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="ellipse" size={6} color={colors.textSecondary} />
                  <BilingualText
                    english={symptom}
                    kinyarwanda={disease.symptoms_kinyarwanda[index] || symptom}
                    primaryColor={colors.text}
                    secondaryColor={colors.textSecondary}
                    inline={false}
                    style={styles.listText}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Treatment */}
          {disease.treatments.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.success + '10', padding: Spacing.md, borderRadius: BorderRadius.md }]}>
              <Text style={[styles.sectionTitle, { color: colors.success }]}>
                {translations.treatment.en} / {translations.treatment.kin}
              </Text>
              {disease.treatments.map((treatment, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <BilingualText
                    english={treatment}
                    kinyarwanda={disease.treatments_kinyarwanda[index] || treatment}
                    primaryColor={colors.text}
                    secondaryColor={colors.textSecondary}
                    inline={false}
                    style={styles.listText}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Dosage */}
          {disease.dosage && (
            <View style={[styles.section, { backgroundColor: colors.warning + '10', padding: Spacing.md, borderRadius: BorderRadius.md }]}>
              <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                {translations.dosage.en} / {translations.dosage.kin}
              </Text>
              <BilingualText
                english={disease.dosage}
                kinyarwanda={disease.dosage_kinyarwanda || disease.dosage}
                primaryColor={colors.text}
                secondaryColor={colors.textSecondary}
                inline={false}
              />
            </View>
          )}

          {/* Prevention */}
          {disease.prevention.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {translations.prevention.en} / {translations.prevention.kin}
              </Text>
              {disease.prevention.map((prev, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.info} />
                  <BilingualText
                    english={prev}
                    kinyarwanda={disease.prevention_kinyarwanda[index] || prev}
                    primaryColor={colors.text}
                    secondaryColor={colors.textSecondary}
                    inline={false}
                    style={styles.listText}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Progression & Recovery */}
          <View style={styles.infoRow}>
            <View style={[styles.infoBox, { backgroundColor: colors.error + '10' }]}>
              <Text style={[styles.infoLabel, { color: colors.error }]}>
                {translations.progression.en}
              </Text>
              <BilingualText
                english={disease.progression}
                kinyarwanda={disease.progression_kinyarwanda}
                primaryColor={colors.text}
                secondaryColor={colors.textSecondary}
                inline={false}
              />
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.success + '10' }]}>
              <Text style={[styles.infoLabel, { color: colors.success }]}>
                {translations.recoveryTime.en}
              </Text>
              <BilingualText
                english={disease.recovery_time}
                kinyarwanda={disease.recovery_time_kinyarwanda}
                primaryColor={colors.text}
                secondaryColor={colors.textSecondary}
                inline={false}
              />
            </View>
          </View>
        </>
      )}
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
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  titleContent: {
    flex: 1,
  },
  diseaseName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  description: {
    marginBottom: Spacing.md,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  listText: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
});

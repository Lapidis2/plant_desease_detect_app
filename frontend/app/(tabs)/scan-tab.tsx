import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { BilingualText } from '../../src/components/BilingualText';
import { translations } from '../../src/constants/translations';

export default function ScanTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <BilingualText
          english={translations.scan.en}
          kinyarwanda={translations.scan.kin}
          primaryColor={colors.text}
          secondaryColor={colors.textSecondary}
          englishStyle={styles.headerTitle}
        />
      </View>

      <View style={styles.content}>
        {/* Main Scan Button */}
        <TouchableOpacity
          style={[styles.mainScanButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/scan')}
          activeOpacity={0.9}
        >
          <View style={styles.scanIconOuter}>
            <View style={styles.scanIconInner}>
              <Ionicons name="scan" size={60} color={colors.white} />
            </View>
          </View>
          <BilingualText
            english="Start Scanning"
            kinyarwanda="Tangira Gusuzuma"
            primaryColor={colors.white}
            secondaryColor={colors.white + 'CC'}
            inline={false}
            englishStyle={styles.scanTitle}
            style={styles.scanText}
          />
          <Text style={[styles.scanSubtitle, { color: colors.white + '99' }]}>
            Take a photo of a plant leaf to identify diseases
          </Text>
          <Text style={[styles.scanSubtitleKin, { color: colors.white + '80' }]}>
            Fata ifoto y'ikijambo kugira ngo umenye indwara
          </Text>
        </TouchableOpacity>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/scan')}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="camera" size={28} color={colors.primary} />
            </View>
            <BilingualText
              english={translations.takePhoto.en}
              kinyarwanda={translations.takePhoto.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              englishStyle={styles.optionTitle}
            />
            <Text style={[styles.optionSubtitle, { color: colors.textTertiary }]}>
              Use camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/scan')}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.secondary + '30' }]}>
              <Ionicons name="images" size={28} color={colors.primaryDark} />
            </View>
            <BilingualText
              english={translations.uploadImage.en}
              kinyarwanda={translations.uploadImage.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              englishStyle={styles.optionTitle}
            />
            <Text style={[styles.optionSubtitle, { color: colors.textTertiary }]}>
              From gallery
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.info + '10' }]}>
          <Ionicons name="bulb" size={24} color={colors.info} />
          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>
              Tips for best results / Inama zo kubona ibisubizo byiza
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Ensure good lighting / Shira urumuri ruhagije
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Focus on the affected leaf / Erekeza ku kijambo kirwaye
            </Text>
            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
              • Take a clear, close-up photo / Fata ifoto yizewe, ya hafi
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  mainScanButton: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  scanIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scanIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanText: {
    textAlign: 'center',
  },
  scanTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  scanSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  scanSubtitleKin: {
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  tipsCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    fontSize: Typography.sizes.sm,
    lineHeight: 22,
  },
});

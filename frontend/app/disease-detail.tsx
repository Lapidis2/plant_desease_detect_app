import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { BilingualText } from '../src/components/BilingualText';
import { DiseaseCard } from '../src/components/DiseaseCard';
import { Disease } from '../src/store/appSlice';

export default function DiseaseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [disease, setDisease] = useState<Disease | null>(null);

  useEffect(() => {
    if (params.disease) {
      try {
        const data = JSON.parse(params.disease as string);
        setDisease(data);
      } catch (error) {
        console.error('Error parsing disease data:', error);
      }
    }
  }, [params.disease]);

  if (!disease) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <BilingualText
          english="Disease Details"
          kinyarwanda="Ibisobanuro by'Indwara"
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
        <DiseaseCard disease={disease} colors={colors} expanded={true} />
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
});

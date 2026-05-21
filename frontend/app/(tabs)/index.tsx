import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { BilingualText } from '../../src/components/BilingualText';
import { WeatherCard } from '../../src/components/WeatherCard';
import { ScanCard } from '../../src/components/ScanCard';
import { CardSkeleton, LoadingSkeleton } from '../../src/components/LoadingSkeleton';
import { translations } from '../../src/constants/translations';
import { getScanHistory, getWeather } from '../../src/services/plantService';
import { ScanHistory, WeatherData, ScanResult } from '../../src/store/appSlice';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistory[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Load weather (can be slow or fail independently)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const weatherData = await getWeather(
            location.coords.latitude,
            location.coords.longitude
          );
          setWeather(weatherData);
          setLocationError(null);
        } catch (error: any) {
          console.error('Weather error:', error);
          const msg = error?.message || 'Current location unavailable. Tap to enable location services.';
          setLocationError(msg);
        }
      } else {
        setLocationError('Location permission denied. Tap here to enable.');
      }
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Separate loading for recent scans so it doesn't get blocked by weather/location
  const loadRecentScans = useCallback(async () => {
    try {
      setRecentLoading(true);
      const history = await getScanHistory(5, true);
      setRecentScans(history || []);
    } catch (error) {
      console.error('Error loading recent scans:', error);
      setRecentScans([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  // Handle tapping the "Enable location" card - handles both permission and device location services
  const handleEnableLocation = useCallback(async () => {
    try {
      // Step 1: Ensure device location services (GPS) are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        await Location.enableNetworkProviderAsync();
      }

      // Step 2: Request app permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const weatherData = await getWeather(
          location.coords.latitude,
          location.coords.longitude
        );
        setWeather(weatherData);
        setLocationError(null);
      } else {
        setLocationError('Location permission denied. Open app settings to allow access.');
        await Location.openAppSettingsAsync();
      }
    } catch (error: any) {
      console.error('Location error:', error);
      const msg = error?.message || 'Unable to get location. Please enable location services in device settings.';
      setLocationError(msg);
      try {
        await Location.openAppSettingsAsync();
      } catch {}
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRecentScans();
  }, [loadData, loadRecentScans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadRecentScans()]);
    setRefreshing(false);
  };

  const navigateToScan = () => {
    router.push('/scan');
  };

  const navigateToResult = (scan: ScanResult) => {
    router.push({
      pathname: '/result',
      params: { scanData: JSON.stringify(scan) },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {translations.welcome.en}
            </Text>
            <Text style={[styles.greetingKin, { color: colors.textTertiary }]}>
              {translations.welcome.kin}
            </Text>
          </View>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="leaf" size={28} color={colors.primary} />
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={navigateToScan}
          activeOpacity={0.9}
        >
          <View style={styles.scanButtonContent}>
            <View style={styles.scanIconContainer}>
              <Ionicons name="scan" size={40} color={colors.white} />
            </View>
            <View style={styles.scanTextContainer}>
              <BilingualText
                english={translations.scanPlant.en}
                kinyarwanda={translations.scanPlant.kin}
                primaryColor={colors.white}
                secondaryColor={colors.white + 'CC'}
                inline={false}
                englishStyle={styles.scanTitle}
              />
              <Text style={[styles.scanSubtitle, { color: colors.white + '99' }]}>
                Take a photo or upload an image
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.white + '99'} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={navigateToScan}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="camera" size={24} color={colors.primary} />
            </View>
            <BilingualText
              english={translations.takePhoto.en}
              kinyarwanda={translations.takePhoto.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              englishStyle={styles.quickActionText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={navigateToScan}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary + '30' }]}>
              <Ionicons name="images" size={24} color={colors.primaryDark} />
            </View>
            <BilingualText
              english={translations.uploadImage.en}
              kinyarwanda={translations.uploadImage.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              englishStyle={styles.quickActionText}
            />
          </TouchableOpacity>
        </View>

        {/* Weather Section */}
        <View style={styles.section}>
          <BilingualText
            english={translations.weather.en}
            kinyarwanda={translations.weather.kin}
            primaryColor={colors.text}
            secondaryColor={colors.textSecondary}
            englishStyle={styles.sectionTitle}
            style={styles.sectionHeader}
          />

          {loading ? (
            <View style={[styles.weatherSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LoadingSkeleton width={60} height={60} borderRadius={30} baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
              <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                <LoadingSkeleton width="60%" height={24} baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
                <LoadingSkeleton width="40%" height={16} style={{ marginTop: 8 }} baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
              </View>
            </View>
          ) : weather ? (
            <WeatherCard weather={weather} colors={colors} />
          ) : (
            <TouchableOpacity
              style={[styles.weatherError, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleEnableLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={24} color={colors.textTertiary} />
              <Text style={[styles.weatherErrorText, { color: colors.textSecondary }]}>
                {locationError || 'Weather unavailable'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Scans */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <BilingualText
              english={translations.recentScans.en}
              kinyarwanda={translations.recentScans.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              englishStyle={styles.sectionTitle}
            />
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

           {recentLoading ? (
             <>
               <CardSkeleton baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
               <CardSkeleton baseColor={colors.surfaceSecondary} highlightColor={colors.surface} />
             </>
           ) : recentScans.length > 0 ? (
            recentScans.map((scan) => (
              <ScanCard
                key={scan.id}
                scan={scan.scan_result}
                onPress={() => navigateToResult(scan.scan_result)}
                colors={colors}
              />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="leaf-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No scans yet. Start by scanning a plant!
              </Text>
              <Text style={[styles.emptyTextKin, { color: colors.textTertiary }]}>
                Nta suzuma irihari. Tangira gusuzuma igihingwa!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  greetingKin: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    marginTop: 2,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  scanSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  seeAll: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  weatherSkeleton: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  weatherError: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  weatherErrorText: {
    fontSize: Typography.sizes.md,
  },
  emptyState: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyTextKin: {
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

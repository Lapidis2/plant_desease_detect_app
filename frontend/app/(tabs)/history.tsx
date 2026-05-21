import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { BilingualText } from '../../src/components/BilingualText';
import { ScanCard } from '../../src/components/ScanCard';
import { CardSkeleton } from '../../src/components/LoadingSkeleton';
import { translations } from '../../src/constants/translations';
import { getScanHistory, deleteScan } from '../../src/services/plantService';
import { ScanHistory, ScanResult } from '../../src/store/appSlice';
import { testBackendConnection, printNetworkDiagnostics, BACKEND_CANDIDATES } from '../../src/utils/networkDiagnostics';


export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ScanHistory[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      console.log('🔍 Fetching scan history...');
      const scans = await getScanHistory(50, false);
      console.log('📊 Raw response from API:', scans);
      // Accept all items that have at least a top-level id (backend always returns this)
      const safeScans = Array.isArray(scans) 
        ? scans.filter((item: any) => item && item.id)
        : [];
      console.log('✅ Filtered scans:', safeScans);
      console.log('📈 Total scans found:', safeScans.length);
      setHistory(safeScans);
    } catch (error) {
      console.error('❌ Error loading history:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Error details:', error);
        
        // If it's a network error, run diagnostics
        if (error.message.includes('Network') || error.message.includes('ECONNREFUSED')) {
          console.log('\n🔧 Running network diagnostics...');
          const diagnostics = await testBackendConnection(BACKEND_CANDIDATES[0]);
          printNetworkDiagnostics(diagnostics);
          
          if (!diagnostics.isReachable) {
            Alert.alert(
              'Connection Error',
              `Cannot reach backend at ${diagnostics.backendUrl}\n\nMake sure:\n1. Backend server is running\n2. Your device is on the same network\n3. Firewall allows port 10000`,
              [{ text: 'OK' }]
            );
          }
        }
      }
      // Set empty array on error so empty state is shown
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Refresh history when tab is focused
  useFocusEffect(
    useCallback(() => {
      console.log('📱 History tab focused - refreshing...');
      loadHistory();
    }, [loadHistory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleDeleteScan = (scan: ScanHistory) => {
    Alert.alert(
      'Delete Scan / Siba Isuzuma',
      'Are you sure you want to delete this scan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScan(scan.id);
              setHistory(prev => prev.filter(s => s.id !== scan.id));
            } catch (error) {
              console.error('Error deleting scan:', error);
              Alert.alert('Error', 'Failed to delete scan.');
            }
          },
        },
      ]
    );
  };

 const navigateToResult = (scanResult?: ScanResult) => {
  if (!scanResult?.id) return;
  router.push(`/scanned/${scanResult.id}`);
};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <BilingualText
          english={translations.history.en}
          kinyarwanda={translations.history.kin}
          primaryColor={colors.text}
          secondaryColor={colors.textSecondary}
          englishStyle={styles.headerTitle}
        />
        <View style={[styles.countBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>
            {history.length} scans
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
        ) : history.length > 0 ? (
          history.map((scan) => (
            <View key={scan.id} style={styles.scanItem}>
            <ScanCard
  scan={{
    ...scan.scan_result,
    image_base64: scan.image_base64   
  }}
  onPress={() => navigateToResult(scan.scan_result)}
  colors={colors}
/>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
                onPress={() => handleDeleteScan(scan)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
            <BilingualText
              english={translations.emptyHistory.en}
              kinyarwanda={translations.emptyHistory.kin}
              primaryColor={colors.text}
              secondaryColor={colors.textSecondary}
              inline={false}
              style={styles.emptyTitle}
              englishStyle={styles.emptyTitleText}
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
  scanItem: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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

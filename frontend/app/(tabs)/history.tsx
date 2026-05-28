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
import { getScanHistory, deleteScan, getScanHistoryCount } from '../../src/services/plantService';
import { ScanHistory, ScanResult } from '../../src/store/appSlice';
import { testBackendConnection, printNetworkDiagnostics, BACKEND_CANDIDATES } from '../../src/utils/networkDiagnostics';


export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 5;

   const loadHistory = useCallback(async (targetPage = page) => {
     try {
       setLoading(true);
       console.log(`🔍 Fetching scan history... Page: ${targetPage}`);
       
       // Get total count of history items
       const count = await getScanHistoryCount();
       setTotalCount(count);

       // Fetch history in small batches with images
       const skip = (targetPage - 1) * LIMIT;
       const scans = await getScanHistory(LIMIT, true, skip);
       console.log('📊 Raw response from API:', scans);
       
       // Filter and validate scans - they should have scan_result with full data
       const safeScans = Array.isArray(scans) 
         ? scans.filter((item: any) => item && item.id && item.scan_result)
         : [];
       
       console.log('✅ Filtered scans:', safeScans);
       console.log('📈 Total scans found on current page:', safeScans.length);
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
   }, [page]);

  useEffect(() => {
    loadHistory(page);
  }, [loadHistory, page]);

  // Refresh history when tab is focused
  useFocusEffect(
    useCallback(() => {
      console.log('📱 History tab focused - refreshing...');
      loadHistory(page);
    }, [loadHistory, page])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory(page);
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
              // Reload page to pull next items
              loadHistory(page);
            } catch (error) {
              console.error('Error deleting scan:', error);
              Alert.alert('Error', 'Failed to delete scan.');
            }
          },
        },
      ]
    );
  };

  const navigateToResult = (scanId?: string) => {
    if (!scanId) return;
    router.push(`/scanned/${scanId}`);
  };

  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    loadHistory(newPage);
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
            {totalCount} scans
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
          <>
            {history.map((scanHistoryItem) => (
              <View key={scanHistoryItem.id} style={styles.scanItem}>
                <ScanCard
                  scan={scanHistoryItem.scan_result}
                  onPress={() => navigateToResult(scanHistoryItem.id)}
                  colors={colors}
                />
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
                  onPress={() => handleDeleteScan(scanHistoryItem)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={[styles.paginationContainer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    { backgroundColor: colors.surfaceSecondary },
                    page === 1 && styles.disabledPageButton
                  ]}
                  onPress={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <Ionicons name="chevron-back" size={18} color={page === 1 ? colors.textTertiary : colors.primary} />
                </TouchableOpacity>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pageNumbersScroll}
                  style={styles.pageNumbersScrollView}
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.pageNumberButton,
                        page === p
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.surfaceSecondary }
                      ]}
                      onPress={() => handlePageChange(p)}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          { color: page === p ? colors.white : colors.text }
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    { backgroundColor: colors.surfaceSecondary },
                    page === totalPages && styles.disabledPageButton
                  ]}
                  onPress={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  <Ionicons name="chevron-forward" size={18} color={page === totalPages ? colors.textTertiary : colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </>
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledPageButton: {
    opacity: 0.3,
  },
  pageNumbersScrollView: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  pageNumbersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    justifyContent: 'center',
    flexGrow: 1,
  },
  pageNumberButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getScanById } from '../../src/services/plantService';
import { Ionicons } from '@expo/vector-icons';
import { Disease, Recommendation, ScanHistory, ScanResult } from '../../src/store/appSlice';

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanRaw, setScanRaw] = useState<ScanHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setLoading(true);
        const res = await getScanById(id as string);
        setScanRaw(res as ScanHistory);

        const normalized = (res.scan_result ? res.scan_result : res) as ScanResult;
        if ((res as ScanHistory).image_base64) {
          normalized.image_base64 = (res as ScanHistory).image_base64 as string;
        }
        if ((res as ScanHistory).image_base64 && normalized.plant) {
          normalized.plant.image_base64 = (res as ScanHistory).image_base64 as string;
        }

        setScan(normalized);
      } catch (err) {
        console.log(err);
        setError('Failed to load scan');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchScan();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading scan...</Text>
      </View>
    );
  }

  if (error || !scan) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={50} color="red" />
        <Text style={styles.errorText}>{error || 'Scan not found'}</Text>
      </View>
    );
  }

  const plant = scan ? scan.plant : scanRaw?.scan_result?.plant;
  const health = scan?.health_score ?? scanRaw?.scan_result?.health_score ?? 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scan Details',
          headerBackVisible: true,
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <Ionicons
          style={{ color: '#2E7D32', marginBottom: 10 }}
          name="arrow-back"
          size={32}
          onPress={() => router.back()}
        />

        {scan?.image_base64 ? (
          <Image
            source={{ uri: scan.image_base64.startsWith('data:') ? scan.image_base64 : `data:image/jpeg;base64,${scan.image_base64.replace(/\s/g, '')}` }}
            style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 16 }}
            resizeMode="cover"
          />
        ) : plant?.image_base64 ? (
          <Image
            source={{ uri: plant.image_base64!.startsWith('data:') ? plant.image_base64 : `data:image/jpeg;base64,${plant.image_base64!.replace(/\s/g, '')}` }}
            style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 16 }}
            resizeMode="cover"
          />
        ) : null}

        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>🌿 Health: {health}%</Text>

        <Text style={{ fontSize: 16, marginBottom: 4 }}>Plant: {plant?.common_name ?? 'Unknown'}</Text>
        <Text style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 8 }}>Scientific: {plant?.scientific_name ?? 'Unknown'}</Text>

        {plant?.description && <Text style={{ marginBottom: 12 }}>{plant.description}</Text>}

        {scan?.recommendations && scan.recommendations.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Top Recommendations</Text>
            {scan.recommendations.slice(0, 3).map((r: Recommendation, i: number) => (
              <View key={i} style={{ padding: 8, backgroundColor: '#f2f2f2', borderRadius: 8, marginTop: 6 }}>
                <Text style={{ fontWeight: '600' }}>{r.title}</Text>
                <Text>{r.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>Diseases ({scan?.diseases?.length ?? 0})</Text>

          {scan?.diseases?.length === 0 ? (
            <Text> No diseases detected</Text>
          ) : (
            scan.diseases.map((d: Disease, i: number) => (
              <View key={i} style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: '600' }}>• {d.name}</Text>
                {d.symptoms?.length > 0 && <Text> Symptoms: {d.symptoms.slice(0, 3).join('; ')}</Text>}
              </View>
            ))
          )}
        </View>

        {scan?.recommendations && scan.recommendations.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>All Recommendations</Text>
            {scan.recommendations.map((r: Recommendation, i: number) => (
              <View key={i} style={{ padding: 10, marginTop: 8, backgroundColor: '#f2f2f2', borderRadius: 8 }}>
                <Text style={{ fontWeight: '600' }}>{r.title}</Text>
                <Text>{r.description}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    fontSize: 16,
  },
});

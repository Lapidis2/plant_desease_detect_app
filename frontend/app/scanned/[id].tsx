import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams,useRouter} from 'expo-router';
import { getScanById } from '../../src/services/plantService';
import { Ionicons } from '@expo/vector-icons';
import { Disease,Recommendation } from '../../src/store/appSlice';

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setLoading(true);
        const res = await getScanById(id as string);
        setScan(res);
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

return (
  <>
    <Stack.Screen
      options={{
        title: 'Scan Details',
        headerBackVisible: true,
        headerBackTitle: 'Back',
      }}
    />
     
    <ScrollView style={{ flex: 1, padding: 70 ,}}>
      <Ionicons
      style={{color: '#2E7D32',bottom: 20, }}
  name="arrow-back"
  size={50}
  onPress={() => router.back()}
/>
      
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
        🌿 Health: {scan?.health_score ?? 0}%
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 5 }}>
        Plant: {scan?.plant?.common_name}
      </Text>

      <Text style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 10 }}>
        Scientific: {scan?.plant?.scientific_name}
      </Text>

      {/* Diseases */}
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Diseases ({scan?.diseases?.length ?? 0})
        </Text>

        {scan?.diseases?.length === 0 ? (
          <Text> No diseases detected</Text>
        ) : (
          scan?.diseases?.map((d: Disease, i: number) => (
            <Text key={i}>⚠️ {d.name}</Text>
          ))
        )}
      </View>

      {/* Recommendations */}
      <View style={{ marginTop: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Recommendations
        </Text>

        {scan?.recommendations?.map((r: Recommendation, i: number) => (
          <View
            key={i}
            style={{
              padding: 10,
              marginTop: 8,
              backgroundColor: '#f2f2f2',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: '600' }}>{r.title}</Text>
            <Text>{r.description}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  </>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

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

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },

  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  value: {
    fontWeight: '600',
    color: '#111',
  },

  recommendation: {
    marginTop: 6,
    paddingLeft: 6,
  },

  recTitle: {
    fontWeight: '600',
    color: '#2E7D32',
  },

  recDesc: {
    color: '#555',
    fontSize: 13,
    marginLeft: 6,
  },
});
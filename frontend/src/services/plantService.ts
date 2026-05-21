import {apiClient} from '../api/client';
import { ScanResult, ScanHistory, GardenPlant, Plant, WeatherData } from '../store/appSlice';


export const analyzePlant = async (
  imageBase64: string,
  latitude?: number,
  longitude?: number
): Promise<ScanResult> => {
  const response = await apiClient.post('/analyze', {
    image_base64: imageBase64,
    latitude,
    longitude,
  }, { timeout: 180000 });
  return response.data;
};

// Get weather data
export const getWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  const response = await apiClient.get('/weather', {
    params: { latitude, longitude },
  });
  return response.data;
};

// Get scan history
export const getScanHistory = async (limit: number = 50, includeImages: boolean = false): Promise<ScanHistory[]> => {
  try {
    console.log(`🌐 API Call: GET /history?limit=${limit}&include_images=${includeImages}`);
    const response = await apiClient.get('/history', {
      params: { limit, include_images: includeImages },
    });
    console.log('✅ History API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ History API Error:', error);
    throw error;
  }
};

// Get scan by ID
export const getScanById = async (scanId: string): Promise<ScanHistory> => {
  const response = await apiClient.get(`/history/${scanId}`);
  return response.data;
};

// Delete scan from history
export const deleteScan = async (scanId: string): Promise<void> => {
 
  await apiClient.delete(`/history/${scanId}`);
};

// Add plant to garden
export const addPlantToGarden = async (
  plant: Plant,
  notes: string = '',
  notesKinyarwanda: string = '',
  
): Promise<GardenPlant> => {
  const response = await apiClient.post('/garden', {
    plant,
    notes,
    notes_kinyarwanda: notesKinyarwanda,
   
  });

  return response.data;
};

// Get garden plants
export const getGarden = async (limit: number = 100): Promise<GardenPlant[]> => {
  const response = await apiClient.get('/garden', {
    params: { limit },
  });
  return response.data;
};

// Get garden plant by ID
export const getGardenPlant = async (plantId: string): Promise<GardenPlant> => {
  const response = await apiClient.get(`/garden/${plantId}`);
  return response.data;
};

// Update garden plant
export const updateGardenPlant = async (
  plantId: string,
  updates: { health_status?: string; notes?: string; notes_kinyarwanda?: string }
): Promise<void> => {
  await apiClient.put(`/garden/${plantId}`, null, {
    params: updates,
  });
};

// Remove plant from garden
export const removePlantFromGarden = async (plantId: string): Promise<void> => {
  await apiClient.delete(`/garden/${plantId}`);
};

// Register push notification token
export const registerPushToken = async (token: string): Promise<void> => {
  await apiClient.post('/notifications/register', null, {
    params: { token },
  });
};

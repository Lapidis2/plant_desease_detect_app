import axios from 'axios';
import Constants from 'expo-constants';

// Get backend URL from environment
const getBaseUrl = (): string => {
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL 
    || process.env.EXPO_PUBLIC_BACKEND_URL 
    || 'https://farm-diagnose-4.preview.emergentagent.com';
  return `${backendUrl}/api`;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // 60 seconds for AI analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;

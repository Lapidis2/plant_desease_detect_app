import axios from 'axios';
import Constants from 'expo-constants';


const getBaseUrl = (): string => {
  let backendUrl =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    'http://10.109.25.135:10000';

  
  if (!backendUrl.startsWith('http')) {
    backendUrl = `http://${backendUrl}`;
  }

  return `${backendUrl}/api`;
};
export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, 
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

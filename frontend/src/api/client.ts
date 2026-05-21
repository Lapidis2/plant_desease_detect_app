import axios from 'axios';
import Constants from 'expo-constants';
import {  testBackendConnection, BACKEND_CANDIDATES } from '../utils/networkDiagnostics';
let backendReady: Promise<void> = Promise.resolve();

const getBaseUrl = (): string => {
  let backendUrl =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    'https://agri-ai-backend-iflu.onrender.com';  

  if (!backendUrl.startsWith('http')) {
    backendUrl = `http://${backendUrl}`;
  }

  console.log('🌐 Backend URL:', backendUrl);
  return `${backendUrl}/api`;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    await backendReady;
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url} (base: ${apiClient.defaults.baseURL})`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response?.data?.detail || error.response?.data?.message || error.message;
      const status = error.response?.status;
      console.error(`❌ API Error [${status}]: ${error.config?.url}`);
      console.error(`   Response:`, message);
    } else if (error.request) {
      // Request made but no response
      console.error(`❌ Network Error: No response from server`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Timeout: ${error.code}`);
      console.error(`   Message: ${error.message}`);
    } else {
      // Error in request setup
      console.error(`❌ Request Setup Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

const initAutoDetect = () => { backendReady = (async () => { console.log('🔍 Fast auto-detecting backend (short timeouts)...'); for (const u of BACKEND_CANDIDATES) { const d = await testBackendConnection(u, 2000); if (d.isReachable) { const b = u.endsWith('/') ? u.slice(0,-1) : u; const newBase = b + '/api'; if (newBase !== apiClient.defaults.baseURL) { console.log('🔄 Auto-switched apiClient to working backend:', newBase); apiClient.defaults.baseURL = newBase; } else { console.log('✅ Using confirmed working backend:', newBase); } return; } } console.warn('⚠️ No reachable backend found in candidates, keeping:', apiClient.defaults.baseURL); })(); }; initAutoDetect();

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorScheme } from '../constants/theme';

// Types
export interface Plant {
  id: string;
  common_name: string;
  common_name_kinyarwanda: string;
  scientific_name: string;
  family: string;
  description: string;
  description_kinyarwanda: string;
  care_tips: string[];
  care_tips_kinyarwanda: string[];
  image_base64?: string;
  created_at?: string;
}

export interface Disease {
  id: string;
  name: string;
  name_kinyarwanda: string;
  description: string;
  description_kinyarwanda: string;
  causes: string[];
  causes_kinyarwanda: string[];
  symptoms: string[];
  symptoms_kinyarwanda: string[];
  treatments: string[];
  treatments_kinyarwanda: string[];
  prevention: string[];
  prevention_kinyarwanda: string[];
  dosage?: string;
  dosage_kinyarwanda?: string;
  severity: 'mild' | 'moderate' | 'severe';
  progression: string;
  progression_kinyarwanda: string;
  recovery_time: string;
  recovery_time_kinyarwanda: string;
  confidence_score: number;
}

export interface Recommendation {
  id: string;
  title: string;
  title_kinyarwanda: string;
  description: string;
  description_kinyarwanda: string;
  priority: 'high' | 'medium' | 'low';
  actions: string[];
  actions_kinyarwanda: string[];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  description_kinyarwanda: string;
  farming_advice: string;
  farming_advice_kinyarwanda: string;
}

export interface ScanResult {
  id: string;
  plant?: Plant;
  diseases: Disease[];
  recommendations: Recommendation[];
  health_score: number;
  scan_date: string;
  image_base64?: string;
  weather_data?: WeatherData;
}

export interface ScanHistory {
    id: string;
    plant_name: string;
    plant_name_kinyarwanda: string;
    scientific_name: string;
    disease_name: string;
    disease_name_kinyarwanda: string;
    confidence: number;
    health_score: number;
    createdAt: string;
    imageUrl: string | null;
}

export interface GardenPlant {
  id: string;
  user_id: string;
  plant: Plant;
  health_status: string;
  last_scan_date?: string;
  scan_history_ids: string[];
  notes: string;
  notes_kinyarwanda: string;
  created_at: string;
}

interface AppState {
  theme: ColorScheme;
  isLoading: boolean;
  currentScan: ScanResult | null;
  scanHistory: ScanHistory[];
  garden: GardenPlant[];
  weather: WeatherData | null;
  error: string | null;
  hasCompletedOnboarding: boolean;
}

const initialState: AppState = {
  theme: 'light',
  isLoading: false,
  currentScan: null,
  scanHistory: [],
  garden: [],
  weather: null,
  error: null,
  hasCompletedOnboarding: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ColorScheme>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentScan: (state, action: PayloadAction<ScanResult | null>) => {
      state.currentScan = action.payload;
    },
    setScanHistory: (state, action: PayloadAction<ScanHistory[]>) => {
      state.scanHistory = action.payload;
    },
    addToHistory: (state, action: PayloadAction<ScanHistory>) => {
      state.scanHistory.unshift(action.payload);
    },
    removeFromHistory: (state, action: PayloadAction<string>) => {
      state.scanHistory = state.scanHistory.filter(s => s.id !== action.payload);
    },
    setGarden: (state, action: PayloadAction<GardenPlant[]>) => {
      state.garden = action.payload;
    },
    addToGarden: (state, action: PayloadAction<GardenPlant>) => {
      state.garden.unshift(action.payload);
    },
    removeFromGarden: (state, action: PayloadAction<string>) => {
      state.garden = state.garden.filter(p => p.id !== action.payload);
    },
    setWeather: (state, action: PayloadAction<WeatherData | null>) => {
      state.weather = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedOnboarding = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setLoading,
  setCurrentScan,
  setScanHistory,
  addToHistory,
  removeFromHistory,
  setGarden,
  addToGarden,
  removeFromGarden,
  setWeather,
  setError,
  clearError,
  setOnboardingComplete,
} = appSlice.actions;

export default appSlice.reducer;

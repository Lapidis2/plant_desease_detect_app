# 🌿 Plant Diagnosis App

A modern **AI-powered plant disease diagnosis mobile application** built with **React Native (Expo)** and a **Python backend**.  
The app allows users to **scan plant leaves**, detect diseases, and receive **actionable treatment recommendations** in real time.



##  Features

- **Leaf Scanning** – Capture or upload plant leaf images  
-  **AI Disease Detection** – Backend-powered ML analysis  
-  **Detailed Results** – Disease name, confidence, and severity  
-  **Smart Recommendations** – Treatment and prevention tips  
-  **Scan History** – Track previous diagnoses  
-  **API Integration** – Fast and scalable backend services  



##  Tech Stack

### Frontend (Mobile)
- React Native
- Expo
- TypeScript
- Expo Router

### Backend (API)
- FastAPI
- Python
- TensorFlow / PyTorch (optional)



##  Project Structure

###  Root Structure
```
plant-diagnosis-app/
│
├── frontend/ # React Native App
├── backend/ # Python API (FastAPI)
├── README.md
```



## 🌱 Leaf Scanning Flow

1. User captures/selects leaf image  
2. Image is sent to backend via API  
3. Backend:
   - Preprocesses image  
   - Runs ML model  
   - Predicts disease  
4. Response returned:

```json
{
  "disease": "Leaf Blight",
  "confidence": 0.92,
  "severity": "High",
  "recommendation": "Apply fungicide and remove infected leaves"
}

`cd frontend
npm install
npx expo start
`
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 10000 --reload

# IMPORTANT: Use --host 0.0.0.0 so mobile devices on same WiFi can reach it via LAN IP from ipconfig
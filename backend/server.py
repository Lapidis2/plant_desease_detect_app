import certifi
from fastapi import BackgroundTasks, FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
import base64
import json
import httpx
import logging
from dotenv import load_dotenv
import asyncio
import random
from pathlib import Path

# Load static agronomic reference data (bilingual)
DATA_PATH = Path(__file__).parent / "agronomic_reference_data.json"
if DATA_PATH.is_file():
    with DATA_PATH.open(encoding="utf-8") as f:
        AGRONOMIC_DATA = json.load(f)
else:
    AGRONOMIC_DATA = []
# =========================
# INIT
# =========================

load_dotenv()

app = FastAPI(title="Agri AI Production API - Gemini Edition", version="7.0")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agri-ai")

# =========================
# ENV
# =========================

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "plant_ai")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = AsyncIOMotorClient(MONGO_URL,tlsCAFile=certifi.where(),serverSelectionTimeoutMS=50000,connectTimeoutMS=50000, socketTimeoutMS=50000)
db = client[DB_NAME]

# =========================
# MODELS
# =========================

class AnalyzeRequest(BaseModel):
    image_base64: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ScanResult(BaseModel):
    id: str
    plant: Dict[str, Any]
    diseases: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    health_score: int
    confidence_score: float
    bilingual: Dict[str, Any]
    weather_data: Optional[Dict[str, Any]] = None
    image_base64: Optional[str] = None
    created_at: datetime


class Plant(BaseModel):
    common_name: str
    scientific_name: str
    family: str
    description: Optional[str] = ""
    description_kinyarwanda: Optional[str] = ""
    image_base64: Optional[str] = ""
    


class GardenPlant(BaseModel):
    id: Optional[str] = None

    plant: Plant
    notes: Optional[str] = ""
    notes_kinyarwanda: Optional[str] = ""
    health_status: Optional[str] = "healthy"
    created_at: Optional[datetime] = None


class AddGardenRequest(BaseModel):
    plant: Plant
    notes: Optional[str] = ""
    notes_kinyarwanda: Optional[str] = ""

class ChatRequest(BaseModel):
    message: str
  







async def call_gemini_with_retry(client_http, url, payload, retries=3):
    print(GEMINI_API_KEY)

    for i in range(retries):
        res = await client_http.post(url, json=payload, timeout=120)

        if res.status_code == 200:
            return res.json()

        if res.status_code == 503:
            wait = (2 ** i) + random.random()
            print(f"Gemini overloaded, retrying in {wait}s...")
            await asyncio.sleep(wait)
            continue

        raise Exception(res.text)

    raise Exception("Gemini failed after retries")    

# =========================
# PLANT IDENTIFICATION (PlantNet)
# =========================

async def identify_plant(image_b64: str):
    try:
        img_bytes = base64.b64decode(image_b64)

        async with httpx.AsyncClient() as client_http:
            response = await client_http.post(
                "https://my-api.plantnet.org/v2/identify/all",
                params={"api-key": os.getenv("PLANTNET_KEY")},
                files={"images": img_bytes},
                timeout=30
            )

        data = response.json()

        if not data.get("results"):
            return fallback_plant()

        best = data["results"][0]
        species = best["species"]

        return {
            "common_name": species.get("commonNames", ["Unknown"])[0],
            "scientific_name": species.get("scientificName", "Unknown"),
            "family": species.get("family", {}).get("scientificName", "Unknown"),
            "confidence": float(best.get("score", 0.6))
        }

    except Exception as e:
        logger.error(f"PlantNet error: {e}")
        return fallback_plant()


def fallback_plant():
    return {
        "common_name": "Unknown",
        "scientific_name": "Unknown",
        "family": "Unknown",
        "confidence": 0.3
    }

def normalize_name(name: str) -> str:
    """Lowercase, strip, remove common suffixes/prefixes for better matching"""
    if not name:
        return ""
    n = name.strip().lower()
    # Common PlantNet variations
    replacements = {
        "solanum lycopersicum": "tomato",
        "solanum tuberosum": "irish potato",
        "capsicum annuum": "chili pepper",
        "capsicum": "sweet pepper",
        "persea americana": "avocado",
        "musa": "banana",
        "musa acuminata": "banana",
        "carica papaya": "papaya",
        "ananas comosus": "pineapple",
        "mangifera indica": "mango",
        "passiflora edulis": "passion fruit",
        "citrus sinensis": "orange",
        "citrus limon": "lemon",
        "allium cepa": "onion",
        "allium sativum": "garlic",
        "daucus carota": "carrot",
        "cucumis sativus": "cucumber",
        "cucurbita": "pumpkin",
        "citrullus lanatus": "watermelon",
        "lactuca sativa": "lettuce",
        "spinacia oleracea": "spinach",
        "brassica oleracea": "cabbage",  # also catches broccoli/cauliflower variants
    }
    for sci, common in replacements.items():
        if sci in n:
            return common
    # remove "common " or "garden " prefixes
    n = n.replace("common ", "").replace("garden ", "").strip()
    return n

def find_static_crop(plant_info: dict):
    """Robust lookup against the 29 supported crops using multiple fields + aliases"""
    if not AGRONOMIC_DATA:
        return None
    candidates = [
        plant_info.get("common_name", ""),
        plant_info.get("scientific_name", ""),
        plant_info.get("common_name_kinyarwanda", ""),
    ]
    for raw in candidates:
        norm = normalize_name(raw)
        if not norm:
            continue
        # exact or contains on several keys
        for p in AGRONOMIC_DATA:
            fields = [
                p.get("common_name", ""),
                p.get("crop_name_en", ""),
                p.get("common_name_kinyarwanda", ""),
                p.get("crop_name_rw", ""),
                p.get("scientific_name", ""),
            ]
            for f in fields:
                fn = normalize_name(f)
                if norm == fn or norm in fn or fn in norm:
                    return p
    return None

# =========================
# GEMINI AI (VISION)
# =========================

async def ask_gemini(image_b64: str, plant_info: dict):
    try:

        prompt = """
You are an expert agricultural plant doctor.

Analyze the plant and return ONLY valid JSON.

Plant info:
""" + json.dumps(plant_info) + """

Return JSON format exactly:

{
  "plant": {
    "common_name": "",
    "common_name_kinyarwanda": "",
    "scientific_name": "",
    "family": "",
    "description": "",
    "description_kinyarwanda": ""
  },
  "diseases": [
    {
      "name": "",
      "name_kinyarwanda": "",
      "description": "",
      "description_kinyarwanda": "",
      "symptoms": [],
      "symptoms_kinyarwanda": [],
      "treatments": [],
      "treatments_kinyarwanda": [],
      "dosage": "",
      "severity": "mild"
    }
  ],
  "recommendations": [
    {
      "title": "",
      "title_kinyarwanda": "",
      "description": "",
      "description_kinyarwanda": "",
      "priority": "medium",
      "actions": [],
      "actions_kinyarwanda": []
    }
  ],
  "health_score": 0,
  "confidence_score": 0.0,
  "bilingual": {
    "en": "",
    "rw": ""
  }
}
IMPORTANT:
- Be practical for farmers
- Give real treatment + dosage
- If healthy → diseases = []
"""

        url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=" + GEMINI_API_KEY

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_b64
                            }
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, timeout=120)

        data = res.json()

        # ❗ safety check
        if "candidates" not in data:
            logger.error(f"Gemini error: {data}")
            return None

        text = data["candidates"][0]["content"]["parts"][0]["text"]

        # remove markdown
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]

        return json.loads(text.strip())

    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return None

async def ask_gemini_chat(message: str) -> str:
    try:
        url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=" + GEMINI_API_KEY
        prompt = f"""
You are an expert agricultural AI assistant. You answer questions about plant health, diseases, farming, and general agriculture.
Be practical, helpful, and concise. Only answer questions related to agriculture and plants.
User question: {message}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, timeout=60)
        data = res.json()
        if "candidates" not in data:
            logger.error(f"Gemini chat error: {data}")
            return "I'm sorry, I couldn't process your request right now."
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        logger.error(f"Gemini chat exception: {e}")
        return "I encountered an error connecting to the AI service."

# =========================
# FALLBACK SAFE RESPONSE
# =========================

def fallback_result(plant):
    """Return useful result even for plants outside the 29-crop static list"""
    name = plant.get("common_name", "the plant")
    sci = plant.get("scientific_name", "")
    return {
        "plant": {
            "common_name": name,
            "common_name_kinyarwanda": name,  # will be overwritten by ensure_ if needed
            "scientific_name": sci,
            "family": plant.get("family", ""),
            "description": f"Detected {name}. This crop is not in the core 29-crop reference set. Use general best practices.",
            "description_kinyarwanda": f"Byabonye {name}. Iki gihingwa nticyari mu gihugu cy'ibanze 29. Koresha imyitozo myiza rusange.",
            "care_tips": ["Water properly", "Ensure good airflow", "Monitor for pests"],
            "care_tips_kinyarwanda": ["Giha amazi neza", "Genzura umuyaga utambuke", "Genzura udukoko"],
        },
        "diseases": [],
        "recommendations": [
            {
                "title": "General Care",
                "title_kinyarwanda": "Ukwita ku gihingwa",
                "description": f"Continue normal care for {name}.",
                "description_kinyarwanda": f"Komeza kwita ku {name} neza.",
                "priority": "medium",
                "actions": ["Regular inspection", "Proper watering", "Remove weeds"],
                "actions_kinyarwanda": ["Genzura buri gihe", "Uha amazi neza", "Kura ibyatsi bibi"]
            }
        ],
        "health_score": 75,
        "confidence_score": plant.get("confidence", 0.5),
        "bilingual": {
            "en": "Plant identified by PlantNet – general advice only",
            "rw": "Igihingwa cyabonywe na PlantNet – inama rusange gusa"
        }
    }
def ensure_kinyarwanda_fallback(plant):
    # Safely add Kinyarwanda fallback fields without raising KeyError
    if "common_name" in plant:
        plant.setdefault("common_name_kinyarwanda", plant["common_name"])
    else:
        plant.setdefault("common_name_kinyarwanda", "")
    plant.setdefault("description_kinyarwanda", plant.get("description", ""))
    return plant
# =========================
# MAIN ANALYSIS PIPELINE
# =========================

async def analyze(image_b64: str):
    """Identify plant and return a structured result.
    Uses static agronomic data when available; otherwise falls back.
    """
    # Identify plant via ML / Gemini (returns dict with at least 'common_name')
    plant = await identify_plant(image_b64)

    # Robust static lookup using the new helper (greatly reduces fallbacks)
    static_entry = find_static_crop(plant) if AGRONOMIC_DATA else None

    if static_entry:
        logger.info(f"✅ Static match found for {plant.get('common_name')} → using agronomic data (no fallback)")
    else:
        logger.info(f"⚠️ No static match for PlantNet result: {plant} → using generic fallback")

    if static_entry:
        # Map your static format -> expected UI/Gemini shape to prevent crashes + fallbacks
        mapped_plant = {
            "common_name": static_entry.get("common_name") or static_entry.get("crop_name_en"),
            "common_name_kinyarwanda": static_entry.get("common_name_kinyarwanda") or static_entry.get("crop_name_rw"),
            "scientific_name": static_entry.get("scientific_name", ""),
            "family": static_entry.get("family", ""),
            "description": static_entry.get("description", f"Healthy {static_entry.get('crop_name_en','crop')} crop."),
            "description_kinyarwanda": static_entry.get("description_kinyarwanda", f"Igihingwa kizima cya {static_entry.get('crop_name_rw', static_entry.get('crop_name_en'))}."),
            "care_tips": static_entry.get("care_tips", []),
            "care_tips_kinyarwanda": static_entry.get("care_tips_kinyarwanda", []),
        }
        mapped_diseases = []
        for d in static_entry.get("diseases", []):
            # Skip the "healthy" state entry – it is not a disease
            if "healthy" in (d.get("disease_code", "") + d.get("disease_name_en", "") + d.get("disease_name_rw", "")).lower():
                continue
            # Map old disease shape to expected Disease shape
            chem = d.get("treatment", {}).get("chemical_rw", []) or d.get("treatment", {}).get("chemical_en", [])
            org = d.get("treatment", {}).get("organic_rw", []) or d.get("treatment", {}).get("organic_en", [])
            mapped_diseases.append({
                "id": d.get("disease_code", ""),
                "name": d.get("disease_name_en", ""),
                "name_kinyarwanda": d.get("disease_name_rw", ""),
                "description": d.get("cause_en", d.get("cause_rw", "")),
                "description_kinyarwanda": d.get("cause_rw", ""),
                "causes": [d.get("cause_en", "")] if d.get("cause_en") else [],
                "causes_kinyarwanda": [d.get("cause_rw", "")] if d.get("cause_rw") else [],
                "symptoms": d.get("symptoms_en", []),
                "symptoms_kinyarwanda": d.get("symptoms_rw", []),
                "treatments": chem + org,
                "treatments_kinyarwanda": chem + org,
                "prevention": d.get("prevention_en", []),
                "prevention_kinyarwanda": d.get("prevention_rw", []),
                "dosage": (chem[0] if chem else "") + (" | " + org[0] if org else ""),
                "dosage_kinyarwanda": (chem[0] if chem else "") + (" | " + org[0] if org else ""),
                "severity": d.get("severity", "medium"),
                "progression": "Monitor and treat early",
                "progression_kinyarwanda": "Genzura kandi uvuze hakiri kare",
                "recovery_time": "7-21 days with treatment",
                "recovery_time_kinyarwanda": "Iminsi 7-21 niba wavuze neza",
                "confidence_score": 0.85
            })
        result = {
            "plant": mapped_plant,
            "diseases": mapped_diseases,
            "recommendations": static_entry.get("recommendations", []),
            "health_score": static_entry.get("health_score", 70),
            "confidence_score": static_entry.get("confidence_score", plant.get("confidence", 0.5)),
            "bilingual": {"en": "", "rw": ""},
        }
    else:
        # Fallback when plant not recognized in static data
        result = fallback_result(plant)

    # Ensure Kinyarwanda fallback fields are present on the plant dict
    result["plant"] = ensure_kinyarwanda_fallback(result.get("plant", plant))
    result.setdefault("diseases", [])
    result.setdefault("recommendations", [])
    result.setdefault("health_score", 70)
    result.setdefault("confidence_score", plant.get("confidence", 0.5))
    result.setdefault("bilingual", {"en": "", "rw": ""})

    return result



# =========================
# Weather data
# =========================
async def get_weather_data(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """Fetch weather data from Open-Meteo API"""
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "temperature_2m,relative_humidity_2m,weather_code",
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "timezone": "auto"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                current = data.get("current", {})
                
                # Map weather codes to descriptions
                weather_codes = {
                    0: ("Clear sky", "Ikirere cyiza"),
                    1: ("Mainly clear", "Ikirere kiza gato"),
                    2: ("Partly cloudy", "Ibicu bike"),
                    3: ("Overcast", "Ibicu byinshi"),
                    45: ("Foggy", "Igihu"),
                    48: ("Depositing rime fog", "Igihu cy'urubura"),
                    51: ("Light drizzle", "Imvura nke"),
                    53: ("Moderate drizzle", "Imvura yoroheje"),
                    55: ("Dense drizzle", "Imvura nyinshi"),
                    61: ("Slight rain", "Imvura nke"),
                    63: ("Moderate rain", "Imvura yoroheje"),
                    65: ("Heavy rain", "Imvura nyinshi"),
                    80: ("Slight rain showers", "Imvura yoroheje"),
                    81: ("Moderate rain showers", "Imvura"),
                    82: ("Violent rain showers", "Imvura nyinshi cyane")
                }
                
                weather_code = current.get("weather_code", 0)
                desc_en, desc_kin = weather_codes.get(weather_code, ("Unknown", "Ntibizwi"))
                
                temp = current.get("temperature_2m", 25)
                humidity = current.get("relative_humidity_2m", 60)
                
                # Generate farming advice based on weather
                advice_en, advice_kin = generate_farming_advice(temp, humidity, weather_code)
                
                return {
                    "temperature": temp,
                    "humidity": humidity,
                    "description": desc_en,
                    "description_kinyarwanda": desc_kin,
                    "farming_advice": advice_en,
                    "farming_advice_kinyarwanda": advice_kin
                }
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
    
    return None

def generate_farming_advice(temp: float, humidity: float, weather_code: int) -> tuple:
    """Generate farming advice based on weather conditions"""
    advice_en = []
    advice_kin = []
    
    if temp > 30:
        advice_en.append("High temperature - water plants in early morning or evening")
        advice_kin.append("Ubushyuhe bukabije - uhire ibihingwa mu gitondo cya kare cyangwa nimugoroba")
    elif temp < 15:
        advice_en.append("Cool weather - protect sensitive plants from cold")
        advice_kin.append("Ikirere gishyushye - rinda ibihingwa byoroheje imbeho")
    
    if humidity > 80:
        advice_en.append("High humidity - monitor for fungal diseases")
        advice_kin.append("Ubuhehere bwinshi - suzuma indwara z'udukoko")
    elif humidity < 40:
        advice_en.append("Low humidity - increase watering frequency")
        advice_kin.append("Ubuhehere buke - ongera guhira ibihingwa")
    
    if weather_code >= 61:  # Rain
        advice_en.append("Rain expected - delay spraying pesticides")
        advice_kin.append("Imvura izagwa - reka gutera imiti yica udukoko")
    
    if not advice_en:
        advice_en.append("Good conditions for general farming activities")
        advice_kin.append("Ibihe byiza by'ibikorwa by'ubuhinzi muri rusange")
    
    return " | ".join(advice_en), " | ".join(advice_kin)
# =========================
# DATABASE
# =========================

async def save_scan(data, image_b64=None):
    try:
        logger.info(f"💾 Saving scan {data['id']} to database")
        result = await db.scans.insert_one({
            "id": data["id"],
            "scan_result": data,
            "image_base64": image_b64,
            "created_at": data["created_at"]
        })
        logger.info(f"✅ Scan {data['id']} saved successfully")
    except Exception as e:
        logger.error(f"❌ Error saving scan: {str(e)}")
        raise

# =========================
# ROUTES
# =========================

@api.post("/chat")
async def chat_route(req: ChatRequest):
    """
    Respond in the language of the user's query using static agronomic data when possible.
    Falls back to Gemini chat if no matching static entry is found.
    Guarantees a non-None reply.
    """
    message = req.message.strip()
    # Simple language detection: presence of non-ASCII characters => Kinyarwanda
    lang = "en"
    if any(ord(ch) > 127 for ch in message):
        lang = "rw"
    else:
        # Fallback to checking known Kinyarwanda terms in static data
        for plant in AGRONOMIC_DATA:
            for key, val in plant.items():
                if isinstance(val, str) and key.endswith("_kinyarwanda"):
                    if val.lower() in message.lower():
                        lang = "rw"
                        break
            if lang == "rw":
                break
    # Try to find a matching plant entry using the robust normalizer + contains
    matched = None
    msg_l = message.lower()
    for p in AGRONOMIC_DATA:
        for key in ["common_name", "crop_name_en", "common_name_kinyarwanda", "crop_name_rw", "scientific_name"]:
            val = normalize_name(p.get(key, ""))
            if val and (val in msg_l or msg_l in val):
                matched = p
                break
        if matched:
            break
    if matched:
        name = matched.get("common_name_kinyarwanda") or matched.get("crop_name_rw") or matched.get("common_name")
        desc = matched.get("description") or f"Reference data available for {matched.get('crop_name_en', name)} (see scan for diseases & safe treatments)."
        desc_rw = matched.get("description_kinyarwanda") or f"Amakuru ya {name} araboneka (suzuma isuzuma ryawe)."
        if lang == "rw":
            reply = f"**{name}**\n\n{desc_rw}"
        else:
            reply = f"**{matched.get('common_name') or matched.get('crop_name_en')}**\n\n{desc}"
        return {"reply": reply}
    # Fallback to Gemini chat
    response = await ask_gemini_chat(message)
    # Ensure a string reply
    if not response:
        response = "I'm sorry, I couldn't process your request at the moment."
    return {"reply": response}

@api.post("/analyze", response_model=ScanResult)
async def analyze_route(req: AnalyzeRequest, background_tasks: BackgroundTasks):

    # 1. extract image
    img = req.image_base64.split(",")[-1]

    # 2. run AI analysis
    result = await analyze(img)

    # 3. enrich result
    result["id"] = str(uuid.uuid4())
    result["created_at"] = datetime.utcnow()
    result["image_base64"] = req.image_base64
    if "plant" in result:
        result["plant"]["image_base64"] = req.image_base64

    if req.latitude and req.longitude:
        result["weather_data"] = None

    # 4. SAVE IN BACKGROUND (IMPORTANT FIX)
    background_tasks.add_task(save_scan, result, req.image_base64)

    # 5. return immediately
    return result

@api.get("/weather")
async def get_weather(latitude: float, longitude: float):
    """Get weather data and farming advice for a location"""
    weather = await get_weather_data(latitude, longitude)
    if weather:
        return weather
    raise HTTPException(status_code=503, detail="Weather service unavailable")
@api.get("/history")
async def history(limit: int = 20, include_images: bool = False):
    logger.info(f"📋 Fetching scan history with limit={limit}, include_images={include_images}")
    scans = await db.scans.find().sort("created_at", -1).limit(limit).to_list(limit)
    logger.info(f"📊 Found {len(scans)} scans in database")

    res_list = []
    for s in scans:
        res = s.get("scan_result", {})
        if include_images:
            if res:
                res["image_base64"] = s.get("image_base64")
                if "plant" in res:
                    res["plant"]["image_base64"] = s.get("image_base64")
            item_image = s.get("image_base64")
        else:
            if res and "image_base64" in res:
                res["image_base64"] = None
            if res and "plant" in res and "image_base64" in res["plant"]:
                res["plant"]["image_base64"] = None
            item_image = None

        res_list.append({
            "id": s["id"],
            "scan_result": res,
            "image_base64": item_image,
            "created_at": s.get("created_at")
        })
    
    logger.info(f"✅ Returning {len(res_list)} formatted scans")
    return res_list


@api.get("/history/{scan_id}")
async def get_scan(scan_id: str):
    scan = await db.scans.find_one({"id": scan_id})

    if not scan:
        raise HTTPException(status_code=404, detail="Not found")

    res = scan.get("scan_result")
    if res:
        res["image_base64"] = scan.get("image_base64")
        if "plant" in res:
            res["plant"]["image_base64"] = scan.get("image_base64")
    return res

@api.delete("/history/{scan_id}")
async def delete_scan(scan_id: str):
    """Delete a scan from history"""
    result = await db.scans.delete_one({"id": scan_id})
    print(await db.scan_history.find_one())
    print(await db.scans.find_one())
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Scan deleted successfully"}
@api.get("/health")
async def health():
    try:
        # Test database connection
        await db.command("ping")
        scan_count = await db.scans.count_documents({})
        logger.info(f"✅ Database connected. Total scans: {scan_count}")
        return {
            "status": "ok",
            "service": "Agri AI Gemini",
            "database": "connected",
            "scan_count": scan_count
        }
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return {
            "status": "error",
            "service": "Agri AI Gemini",
            "database": "disconnected",
            "error": str(e)
        }

# =========================
# GARDEN
# =========================

@api.post("/garden")
async def add_garden(req: AddGardenRequest):

    plant = {
        "id": str(uuid.uuid4()),
        "plant": req.plant.dict(),
        "notes": req.notes,
        "notes_kinyarwanda": req.notes_kinyarwanda,
        "created_at": datetime.utcnow()
    }

    await db.garden.insert_one(plant)

    plant["_id"] = str(plant.get("_id", ""))  # safe conversion

    return plant


@api.get("/garden")
async def get_garden():
    plants = await db.garden.find().to_list(100)

    return [
        {
            "id": p.get("id"),
            "plant": p.get("plant"),
            "notes": p.get("notes"),
            "notes_kinyarwanda": p.get("notes_kinyarwanda"),
            "created_at": p.get("created_at"),
            "_id": str(p.get("_id"))  # 🔥 FIX HERE
        }
        for p in plants
    ]

@api.delete("/garden/{plant_id}")
async def remove_from_garden(plant_id: str):
    """Remove a plant from the garden"""
    result = await db.garden.delete_one({"id": plant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant removed from garden"}

# =========================
# APP SETUP
# =========================

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json
import httpx
import base64

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import emergent integrations for AI
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'plant_doctor')]

# Get Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="Plant Doctor API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class Plant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    common_name: str
    common_name_kinyarwanda: str
    scientific_name: str
    family: str
    description: str
    description_kinyarwanda: str
    care_tips: List[str] = []
    care_tips_kinyarwanda: List[str] = []
    image_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Disease(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_kinyarwanda: str
    description: str
    description_kinyarwanda: str
    causes: List[str] = []
    causes_kinyarwanda: List[str] = []
    symptoms: List[str] = []
    symptoms_kinyarwanda: List[str] = []
    treatments: List[str] = []
    treatments_kinyarwanda: List[str] = []
    prevention: List[str] = []
    prevention_kinyarwanda: List[str] = []
    dosage: Optional[str] = None
    dosage_kinyarwanda: Optional[str] = None
    severity: str  # mild, moderate, severe
    progression: str
    progression_kinyarwanda: str
    recovery_time: str
    recovery_time_kinyarwanda: str
    confidence_score: float = 0.0

class Recommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    title_kinyarwanda: str
    description: str
    description_kinyarwanda: str
    priority: str  # high, medium, low
    actions: List[str] = []
    actions_kinyarwanda: List[str] = []

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plant: Optional[Plant] = None
    diseases: List[Disease] = []
    recommendations: List[Recommendation] = []
    health_score: int = 100
    scan_date: datetime = Field(default_factory=datetime.utcnow)
    image_base64: Optional[str] = None
    weather_data: Optional[Dict[str, Any]] = None

class ScanHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    scan_result: ScanResult
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GardenPlant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    plant: Plant
    health_status: str = "healthy"
    last_scan_date: Optional[datetime] = None
    scan_history_ids: List[str] = []
    notes: str = ""
    notes_kinyarwanda: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ImageAnalysisRequest(BaseModel):
    image_base64: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    description: str
    description_kinyarwanda: str
    farming_advice: str
    farming_advice_kinyarwanda: str

# ==================== AI ANALYSIS SERVICE ====================

async def analyze_plant_image(image_base64: str) -> Dict[str, Any]:
    """Use Gemini Vision to analyze plant image for identification and disease detection"""
    try:
        if not EMERGENT_LLM_KEY:
            logger.error("EMERGENT_LLM_KEY not configured")
            raise HTTPException(status_code=500, detail="AI service not configured")

        # Create LLM chat instance with Gemini
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"plant-analysis-{uuid.uuid4()}",
            system_message="""You are an expert botanist and plant pathologist. Analyze plant images to:
1. Identify the plant species
2. Detect any diseases or health issues
3. Provide treatment recommendations

Always respond in valid JSON format with the following structure:
{
    "plant": {
        "common_name": "Plant Name in English",
        "common_name_kinyarwanda": "Plant Name in Kinyarwanda",
        "scientific_name": "Scientific name",
        "family": "Plant family",
        "description": "Brief description in English",
        "description_kinyarwanda": "Brief description in Kinyarwanda",
        "care_tips": ["tip1", "tip2"],
        "care_tips_kinyarwanda": ["tip1 in Kinyarwanda", "tip2 in Kinyarwanda"]
    },
    "diseases": [
        {
            "name": "Disease name in English",
            "name_kinyarwanda": "Disease name in Kinyarwanda",
            "description": "Description in English",
            "description_kinyarwanda": "Description in Kinyarwanda",
            "causes": ["cause1", "cause2"],
            "causes_kinyarwanda": ["cause1 in Kinyarwanda", "cause2 in Kinyarwanda"],
            "symptoms": ["symptom1", "symptom2"],
            "symptoms_kinyarwanda": ["symptom1 in Kinyarwanda", "symptom2 in Kinyarwanda"],
            "treatments": ["treatment1", "treatment2"],
            "treatments_kinyarwanda": ["treatment1 in Kinyarwanda", "treatment2 in Kinyarwanda"],
            "prevention": ["prevention1", "prevention2"],
            "prevention_kinyarwanda": ["prevention1 in Kinyarwanda", "prevention2 in Kinyarwanda"],
            "dosage": "Specific dosage instructions for farmers",
            "dosage_kinyarwanda": "Dosage in Kinyarwanda",
            "severity": "mild/moderate/severe",
            "progression": "What happens if untreated (English)",
            "progression_kinyarwanda": "What happens if untreated (Kinyarwanda)",
            "recovery_time": "Expected recovery time (English)",
            "recovery_time_kinyarwanda": "Expected recovery time (Kinyarwanda)",
            "confidence_score": 0.85
        }
    ],
    "recommendations": [
        {
            "title": "Recommendation title in English",
            "title_kinyarwanda": "Recommendation title in Kinyarwanda",
            "description": "Detailed recommendation in English",
            "description_kinyarwanda": "Detailed recommendation in Kinyarwanda",
            "priority": "high/medium/low",
            "actions": ["action1", "action2"],
            "actions_kinyarwanda": ["action1 in Kinyarwanda", "action2 in Kinyarwanda"]
        }
    ],
    "health_score": 85
}

If the plant is healthy, return an empty diseases array and health_score of 100.
If it's not a plant image, still try to identify what you see but indicate uncertainty.
IMPORTANT: Provide practical farming advice with specific dosages where applicable.
"""
        ).with_model("gemini", "gemini-2.5-flash")

        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create message with image
        user_message = UserMessage(
            text="Please analyze this plant image. Identify the plant species, detect any diseases or health issues, and provide detailed treatment recommendations with dosages suitable for farmers. Provide all information in both English and Kinyarwanda.",
            file_contents=[image_content]
        )

        # Get AI response
        response = await chat.send_message(user_message)
        logger.info(f"AI Response received: {response[:500]}...")

        # Parse JSON from response
        # Try to extract JSON from the response
        json_str = response
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0]
        
        result = json.loads(json_str.strip())
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        # Return a fallback response
        return get_fallback_analysis()
    except Exception as e:
        logger.error(f"Error analyzing plant image: {e}")
        return get_fallback_analysis()

def get_fallback_analysis() -> Dict[str, Any]:
    """Return fallback analysis when AI fails"""
    return {
        "plant": {
            "common_name": "Unknown Plant",
            "common_name_kinyarwanda": "Igihingwa kitazwi",
            "scientific_name": "Unknown",
            "family": "Unknown",
            "description": "Unable to identify the plant. Please try with a clearer image.",
            "description_kinyarwanda": "Ntibashobora kumenya igihingwa. Gerageza ifoto yizewe.",
            "care_tips": ["Ensure adequate sunlight", "Water regularly", "Check soil drainage"],
            "care_tips_kinyarwanda": ["Shira urumuri ruhagije", "Uhire kenshi", "Suzuma uburyo bw'amazi"]
        },
        "diseases": [],
        "recommendations": [
            {
                "title": "General Plant Care",
                "title_kinyarwanda": "Kwita ku bihingwa muri rusange",
                "description": "Maintain regular watering schedule and ensure proper drainage.",
                "description_kinyarwanda": "Komeza guhira neza kandi usuzume amazi.",
                "priority": "medium",
                "actions": ["Check soil moisture daily", "Ensure 6-8 hours of sunlight"],
                "actions_kinyarwanda": ["Suzuma ubuhehere bw'ubutaka buri munsi", "Shira urumuri amasaha 6-8"]
            }
        ],
        "health_score": 70
    }

# ==================== WEATHER SERVICE ====================

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

# ==================== API ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Plant Doctor API - Helping farmers grow healthier crops"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Plant Analysis Endpoint
@api_router.post("/analyze", response_model=ScanResult)
async def analyze_plant(request: ImageAnalysisRequest):
    """Analyze a plant image for identification and disease detection"""
    try:
        # Validate image
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="Image is required")
        
        # Clean base64 string
        image_data = request.image_base64
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        # Analyze with AI
        analysis = await analyze_plant_image(image_data)
        
        # Get weather data if location provided
        weather_data = None
        if request.latitude and request.longitude:
            weather_data = await get_weather_data(request.latitude, request.longitude)
        
        # Build scan result
        plant_data = analysis.get("plant", {})
        plant = Plant(
            common_name=plant_data.get("common_name", "Unknown"),
            common_name_kinyarwanda=plant_data.get("common_name_kinyarwanda", "Ntibizwi"),
            scientific_name=plant_data.get("scientific_name", "Unknown"),
            family=plant_data.get("family", "Unknown"),
            description=plant_data.get("description", ""),
            description_kinyarwanda=plant_data.get("description_kinyarwanda", ""),
            care_tips=plant_data.get("care_tips", []),
            care_tips_kinyarwanda=plant_data.get("care_tips_kinyarwanda", []),
            image_base64=image_data[:100] + "..." if image_data else None  # Store truncated for reference
        )
        
        diseases = []
        for d in analysis.get("diseases", []):
            disease = Disease(
                name=d.get("name", ""),
                name_kinyarwanda=d.get("name_kinyarwanda", ""),
                description=d.get("description", ""),
                description_kinyarwanda=d.get("description_kinyarwanda", ""),
                causes=d.get("causes", []),
                causes_kinyarwanda=d.get("causes_kinyarwanda", []),
                symptoms=d.get("symptoms", []),
                symptoms_kinyarwanda=d.get("symptoms_kinyarwanda", []),
                treatments=d.get("treatments", []),
                treatments_kinyarwanda=d.get("treatments_kinyarwanda", []),
                prevention=d.get("prevention", []),
                prevention_kinyarwanda=d.get("prevention_kinyarwanda", []),
                dosage=d.get("dosage", ""),
                dosage_kinyarwanda=d.get("dosage_kinyarwanda", ""),
                severity=d.get("severity", "moderate"),
                progression=d.get("progression", ""),
                progression_kinyarwanda=d.get("progression_kinyarwanda", ""),
                recovery_time=d.get("recovery_time", ""),
                recovery_time_kinyarwanda=d.get("recovery_time_kinyarwanda", ""),
                confidence_score=d.get("confidence_score", 0.8)
            )
            diseases.append(disease)
        
        recommendations = []
        for r in analysis.get("recommendations", []):
            rec = Recommendation(
                title=r.get("title", ""),
                title_kinyarwanda=r.get("title_kinyarwanda", ""),
                description=r.get("description", ""),
                description_kinyarwanda=r.get("description_kinyarwanda", ""),
                priority=r.get("priority", "medium"),
                actions=r.get("actions", []),
                actions_kinyarwanda=r.get("actions_kinyarwanda", [])
            )
            recommendations.append(rec)
        
        scan_result = ScanResult(
            plant=plant,
            diseases=diseases,
            recommendations=recommendations,
            health_score=analysis.get("health_score", 100),
            image_base64=image_data,
            weather_data=weather_data
        )
        
        # Save to history
        history_entry = ScanHistory(
            scan_result=scan_result
        )
        await db.scan_history.insert_one(history_entry.dict())
        
        return scan_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in plant analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Weather Endpoint
@api_router.get("/weather")
async def get_weather(latitude: float, longitude: float):
    """Get weather data and farming advice for a location"""
    weather = await get_weather_data(latitude, longitude)
    if weather:
        return weather
    raise HTTPException(status_code=503, detail="Weather service unavailable")

# Scan History Endpoints
@api_router.get("/history", response_model=List[ScanHistory])
async def get_scan_history(limit: int = 50):
    """Get scan history"""
    history = await db.scan_history.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [ScanHistory(**h) for h in history]

@api_router.get("/history/{scan_id}", response_model=ScanHistory)
async def get_scan_by_id(scan_id: str):
    """Get a specific scan by ID"""
    scan = await db.scan_history.find_one({"id": scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return ScanHistory(**scan)

@api_router.delete("/history/{scan_id}")
async def delete_scan(scan_id: str):
    """Delete a scan from history"""
    result = await db.scan_history.delete_one({"id": scan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Scan deleted successfully"}

# Garden Endpoints
@api_router.post("/garden", response_model=GardenPlant)
async def add_to_garden(plant: Plant, notes: str = "", notes_kinyarwanda: str = ""):
    """Add a plant to the user's garden"""
    garden_plant = GardenPlant(
        plant=plant,
        notes=notes,
        notes_kinyarwanda=notes_kinyarwanda
    )
    await db.garden.insert_one(garden_plant.dict())
    return garden_plant

@api_router.get("/garden", response_model=List[GardenPlant])
async def get_garden(limit: int = 100):
    """Get all plants in the user's garden"""
    plants = await db.garden.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [GardenPlant(**p) for p in plants]

@api_router.get("/garden/{plant_id}", response_model=GardenPlant)
async def get_garden_plant(plant_id: str):
    """Get a specific plant from the garden"""
    plant = await db.garden.find_one({"id": plant_id})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found in garden")
    return GardenPlant(**plant)

@api_router.put("/garden/{plant_id}")
async def update_garden_plant(plant_id: str, health_status: str = None, notes: str = None, notes_kinyarwanda: str = None):
    """Update a plant in the garden"""
    update_data = {}
    if health_status:
        update_data["health_status"] = health_status
    if notes is not None:
        update_data["notes"] = notes
    if notes_kinyarwanda is not None:
        update_data["notes_kinyarwanda"] = notes_kinyarwanda
    
    if update_data:
        result = await db.garden.update_one({"id": plant_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Plant not found")
    
    return {"message": "Plant updated successfully"}

@api_router.delete("/garden/{plant_id}")
async def remove_from_garden(plant_id: str):
    """Remove a plant from the garden"""
    result = await db.garden.delete_one({"id": plant_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant removed from garden"}

# Notifications Endpoint (for push notifications)
@api_router.post("/notifications/register")
async def register_push_token(token: str, user_id: str = "default_user"):
    """Register a push notification token"""
    await db.push_tokens.update_one(
        {"user_id": user_id},
        {"$set": {"token": token, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Token registered successfully"}

# Community Endpoints
class CommunityPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    title: str
    title_kinyarwanda: str = ""
    content: str
    content_kinyarwanda: str = ""
    image_base64: Optional[str] = None
    plant_name: Optional[str] = None
    likes: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str = "default_user"
    content: str
    content_kinyarwanda: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

@api_router.post("/community/posts", response_model=CommunityPost)
async def create_post(post: CommunityPost):
    """Create a community post"""
    await db.community_posts.insert_one(post.dict())
    return post

@api_router.get("/community/posts", response_model=List[CommunityPost])
async def get_posts(limit: int = 50):
    """Get community posts"""
    posts = await db.community_posts.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [CommunityPost(**p) for p in posts]

@api_router.post("/community/posts/{post_id}/like")
async def like_post(post_id: str):
    """Like a community post"""
    result = await db.community_posts.update_one(
        {"id": post_id},
        {"$inc": {"likes": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post liked"}

@api_router.post("/community/posts/{post_id}/comments", response_model=Comment)
async def add_comment(post_id: str, content: str, content_kinyarwanda: str = ""):
    """Add a comment to a post"""
    comment = Comment(
        post_id=post_id,
        content=content,
        content_kinyarwanda=content_kinyarwanda
    )
    await db.comments.insert_one(comment.dict())
    await db.community_posts.update_one(
        {"id": post_id},
        {"$inc": {"comments_count": 1}}
    )
    return comment

@api_router.get("/community/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: str):
    """Get comments for a post"""
    comments = await db.comments.find({"post_id": post_id}).sort("created_at", -1).to_list(100)
    return [Comment(**c) for c in comments]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

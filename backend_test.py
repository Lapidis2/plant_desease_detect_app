#!/usr/bin/env python3
"""
Plant Doctor Backend API Test Suite
Tests all backend endpoints for the Plant Doctor application
"""

import requests
import json
import base64
from datetime import datetime
import sys
import os

# API Base URL from frontend environment
API_BASE_URL = "https://farm-diagnose-4.preview.emergentagent.com/api"

# Test coordinates for Rwanda
TEST_LATITUDE = -1.9403
TEST_LONGITUDE = 29.8739

def create_test_plant_image():
    """Create a base64 encoded test plant image (simple green leaf pattern)"""
    # This creates a simple PNG image data representing a green leaf
    # In a real scenario, you'd use an actual plant photo
    import io
    try:
        from PIL import Image, ImageDraw
        
        # Create a simple green leaf-like image
        img = Image.new('RGB', (200, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw a simple leaf shape
        draw.ellipse([50, 50, 150, 150], fill='green', outline='darkgreen', width=3)
        draw.line([100, 50, 100, 150], fill='darkgreen', width=2)  # Leaf vein
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')
    except ImportError:
        # Fallback: create a minimal valid PNG base64 string
        # This is a 1x1 green pixel PNG
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA4nEKtAAAAABJRU5ErkJggg=="

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing Health Endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            # Validate response structure
            if "status" in data and "timestamp" in data:
                print("✅ Health endpoint working correctly")
                return True
            else:
                print("❌ Health endpoint missing required fields")
                return False
        else:
            print(f"❌ Health endpoint failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_weather_endpoint():
    """Test the weather endpoint"""
    print("\n🌤️ Testing Weather Endpoint...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/weather",
            params={"latitude": TEST_LATITUDE, "longitude": TEST_LONGITUDE},
            timeout=15
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate bilingual response
            required_fields = ["temperature", "humidity", "description", "description_kinyarwanda", 
                             "farming_advice", "farming_advice_kinyarwanda"]
            
            missing_fields = [field for field in required_fields if field not in data]
            if not missing_fields:
                print("✅ Weather endpoint working with bilingual support")
                return True
            else:
                print(f"❌ Weather endpoint missing fields: {missing_fields}")
                return False
        else:
            print(f"❌ Weather endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Weather endpoint error: {e}")
        return False

def test_history_endpoints():
    """Test scan history CRUD operations"""
    print("\n📚 Testing History Endpoints...")
    try:
        # Test GET history
        response = requests.get(f"{API_BASE_URL}/history", timeout=10)
        print(f"GET History Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"History count: {len(data)}")
            print("✅ History GET endpoint working")
            
            # If there are history items, test individual scan retrieval
            if data:
                scan_id = data[0].get("id")
                if scan_id:
                    individual_response = requests.get(f"{API_BASE_URL}/history/{scan_id}", timeout=10)
                    if individual_response.status_code == 200:
                        print("✅ Individual scan retrieval working")
                    else:
                        print(f"❌ Individual scan retrieval failed: {individual_response.status_code}")
                        return False
            
            return True
        else:
            print(f"❌ History endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ History endpoint error: {e}")
        return False

def test_garden_endpoints():
    """Test garden CRUD operations"""
    print("\n🌱 Testing Garden Endpoints...")
    try:
        # Test GET garden
        response = requests.get(f"{API_BASE_URL}/garden", timeout=10)
        print(f"GET Garden Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Garden plants count: {len(data)}")
            print("✅ Garden GET endpoint working")
            
            # Test POST garden (add a plant)
            test_plant = {
                "common_name": "Test Tomato",
                "common_name_kinyarwanda": "Inyanya y'ikizamini",
                "scientific_name": "Solanum lycopersicum",
                "family": "Solanaceae",
                "description": "A test tomato plant for API testing",
                "description_kinyarwanda": "Igihingwa cy'inyanya cyo gukora ikizamini",
                "care_tips": ["Water regularly", "Provide support"],
                "care_tips_kinyarwanda": ["Uhire kenshi", "Utange inkunga"]
            }
            
            post_response = requests.post(
                f"{API_BASE_URL}/garden",
                json=test_plant,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print(f"POST Garden Status Code: {post_response.status_code}")
            
            if post_response.status_code == 200:
                plant_data = post_response.json()
                plant_id = plant_data.get("id")
                print(f"✅ Garden POST endpoint working, created plant ID: {plant_id}")
                
                # Test individual plant retrieval
                if plant_id:
                    get_response = requests.get(f"{API_BASE_URL}/garden/{plant_id}", timeout=10)
                    if get_response.status_code == 200:
                        print("✅ Individual garden plant retrieval working")
                    else:
                        print(f"❌ Individual garden plant retrieval failed: {get_response.status_code}")
                
                return True
            else:
                print(f"❌ Garden POST failed with status {post_response.status_code}")
                print(f"Response: {post_response.text}")
                return False
            
        else:
            print(f"❌ Garden GET endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Garden endpoint error: {e}")
        return False

def test_analyze_endpoint():
    """Test the AI plant analysis endpoint"""
    print("\n🔬 Testing AI Plant Analysis Endpoint...")
    try:
        # Create test image
        test_image = create_test_plant_image()
        
        # Prepare request data
        request_data = {
            "image_base64": test_image,
            "latitude": TEST_LATITUDE,
            "longitude": TEST_LONGITUDE
        }
        
        print("Sending analysis request...")
        response = requests.post(
            f"{API_BASE_URL}/analyze",
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=30  # AI analysis might take longer
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Analysis Response Keys: {list(data.keys())}")
            
            # Validate response structure
            required_fields = ["plant", "diseases", "recommendations", "health_score"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Check bilingual plant information
                plant = data.get("plant", {})
                if "common_name" in plant and "common_name_kinyarwanda" in plant:
                    print("✅ AI Analysis endpoint working with bilingual plant identification")
                    print(f"Plant identified: {plant.get('common_name')} / {plant.get('common_name_kinyarwanda')}")
                    print(f"Health Score: {data.get('health_score')}")
                    print(f"Diseases found: {len(data.get('diseases', []))}")
                    print(f"Recommendations: {len(data.get('recommendations', []))}")
                    
                    # Check if weather data is included
                    if "weather_data" in data and data["weather_data"]:
                        print("✅ Weather data included in analysis")
                    
                    return True
                else:
                    print("❌ AI Analysis missing bilingual plant information")
                    return False
            else:
                print(f"❌ AI Analysis missing required fields: {missing_fields}")
                return False
        else:
            print(f"❌ AI Analysis failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ AI Analysis endpoint error: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Plant Doctor Backend API Tests")
    print(f"Testing API at: {API_BASE_URL}")
    print("=" * 60)
    
    test_results = {
        "health": test_health_endpoint(),
        "weather": test_weather_endpoint(),
        "history": test_history_endpoints(),
        "garden": test_garden_endpoints(),
        "analyze": test_analyze_endpoint()
    }
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.upper():<15} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests passed!")
        return True
    else:
        print("⚠️ Some tests failed. Check the details above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
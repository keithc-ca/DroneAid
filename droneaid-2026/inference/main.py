"""
DroneAid 2026 - Inference Service
FastAPI-based REST API for DroneAid symbol detection
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import cv2
import numpy as np
from PIL import Image
import io
import base64
from pathlib import Path

from model import DroneAidDetector

# Initialize FastAPI app with increased body size limit
app = FastAPI(
    title="DroneAid 2026 Inference API",
    description="Real-time detection API for DroneAid disaster response symbols",
    version="2.0.0",
    # Increase max request body size to 50MB
    max_request_size=50 * 1024 * 1024
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model
detector = DroneAidDetector()

# Response models
class Detection(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]  # [x, y, width, height]
    
class DetectionResponse(BaseModel):
    detections: List[Detection]
    image_width: int
    image_height: int
    processing_time_ms: float

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: Optional[str]

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "service": "DroneAid 2026 Inference API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "detect": "/detect (POST with image file)",
            "detect_base64": "/detect/base64 (POST with base64 image)",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": detector.model is not None,
        "model_path": str(detector.model_path) if detector.model_path else None
    }

@app.post("/detect", response_model=DetectionResponse)
async def detect_image(file: UploadFile = File(...), conf_threshold: float = 0.5):
    """
    Detect DroneAid symbols in an uploaded image
    
    Args:
        file: Image file (JPEG, PNG)
        conf_threshold: Confidence threshold (0.0-1.0)
    
    Returns:
        Detection results with bounding boxes and classifications
    """
    try:
        # Read image file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Run detection
        results = detector.detect(image, conf_threshold=conf_threshold)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/detect/base64", response_model=DetectionResponse)
async def detect_base64(image_data: str, conf_threshold: float = 0.5):
    """
    Detect DroneAid symbols in a base64-encoded image
    
    Args:
        image_data: Base64-encoded image string
        conf_threshold: Confidence threshold (0.0-1.0)
    
    Returns:
        Detection results with bounding boxes and classifications
    """
    try:
        # Decode base64 image
        if ',' in image_data:  # Handle data URL format
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Run detection
        results = detector.detect(image, conf_threshold=conf_threshold)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/classes")
async def get_classes():
    """Get list of detectable symbol classes"""
    return {
        "classes": detector.class_names,
        "count": len(detector.class_names)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

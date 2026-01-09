"""
DroneAid 2026 - Model Wrapper
Handles model loading and inference
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any
import time
from ultralytics import YOLO

class DroneAidDetector:
    """DroneAid symbol detector using YOLOv8"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize the detector
        
        Args:
            model_path: Path to the YOLO model (.pt or .onnx)
        """
        self.model = None
        self.model_path = None
        self.class_names = [
            'children',
            'elderly',
            'firstaid',
            'food',
            'ok',
            'shelter',
            'sos',
            'water'
        ]
        
        # Try to load model
        if model_path is None:
            # Search for model in standard locations
            search_paths = [
                './models/droneaid/weights/best.pt',
                './models/best.pt',
                './models/droneaid.pt',
                '../training/models/droneaid/weights/best.pt',
            ]
            
            for path in search_paths:
                if Path(path).exists():
                    model_path = path
                    break
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        else:
            print("Warning: No model found. Model will need to be loaded before inference.")
    
    def load_model(self, model_path: str):
        """Load a YOLO model"""
        try:
            print(f"Loading model from {model_path}...")
            self.model = YOLO(model_path)
            self.model_path = Path(model_path)
            
            # Get class names from model if available
            if hasattr(self.model, 'names'):
                self.class_names = list(self.model.names.values())
            
            print(f"Model loaded successfully!")
            print(f"Classes: {self.class_names}")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
            raise
    
    def detect(self, image: np.ndarray, conf_threshold: float = 0.5) -> Dict[str, Any]:
        """
        Run detection on an image
        
        Args:
            image: OpenCV image (BGR format)
            conf_threshold: Confidence threshold for detections
        
        Returns:
            Dictionary with detection results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Please load a model first.")
        
        start_time = time.time()
        
        # Run inference
        results = self.model(image, conf=conf_threshold, verbose=False)[0]
        
        # Parse results
        detections = []
        
        if results.boxes is not None:
            boxes = results.boxes.cpu().numpy()
            
            for box in boxes:
                # Extract box data
                xyxy = box.xyxy[0]  # [x1, y1, x2, y2]
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                
                # Convert to [x, y, width, height]
                x1, y1, x2, y2 = xyxy
                bbox = [
                    float(x1),
                    float(y1),
                    float(x2 - x1),
                    float(y2 - y1)
                ]
                
                detection = {
                    "class_name": self.class_names[cls],
                    "confidence": conf,
                    "bbox": bbox
                }
                
                detections.append(detection)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return {
            "detections": detections,
            "image_width": image.shape[1],
            "image_height": image.shape[0],
            "processing_time_ms": round(processing_time, 2)
        }
    
    def detect_with_visualization(self, image: np.ndarray, conf_threshold: float = 0.5) -> tuple:
        """
        Run detection and return both results and annotated image
        
        Args:
            image: OpenCV image (BGR format)
            conf_threshold: Confidence threshold
        
        Returns:
            Tuple of (detection_results, annotated_image)
        """
        results_dict = self.detect(image, conf_threshold)
        
        # Draw bounding boxes on image
        annotated_image = image.copy()
        
        for detection in results_dict['detections']:
            bbox = detection['bbox']
            x, y, w, h = bbox
            x1, y1, x2, y2 = int(x), int(y), int(x + w), int(y + h)
            
            # Draw rectangle
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label = f"{detection['class_name']}: {detection['confidence']:.2f}"
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated_image, (x1, y1 - label_h - 10), (x1 + label_w, y1), (0, 255, 0), -1)
            cv2.putText(annotated_image, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
        
        return results_dict, annotated_image

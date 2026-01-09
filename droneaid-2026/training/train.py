"""
DroneAid 2026 - Model Training Script
Trains a YOLOv8 model on the DroneAid symbol dataset
"""

import os
from pathlib import Path
from ultralytics import YOLO
import torch

def train_model():
    """Train YOLOv8 model on DroneAid dataset"""
    
    print("="*60)
    print("DroneAid 2026 - Model Training")
    print("="*60)
    
    # Check for GPU
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"\nUsing device: {device}")
    if device == 'cuda':
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    # Prepare dataset first
    print("\n[1/3] Preparing dataset...")
    from prepare_data import main as prepare_dataset
    prepare_dataset()
    
    # Initialize YOLOv8 model
    print("\n[2/3] Initializing YOLOv8 model...")
    # Start with YOLOv8n (nano) for faster training, can use yolov8s/m/l for better accuracy
    model = YOLO('yolov8n.pt')
    
    # Training parameters
    data_yaml = './data/droneaid_dataset/dataset.yaml'
    epochs = 100
    imgsz = 640
    batch = 16  # Adjust based on available memory
    
    print("\n[3/3] Starting training...")
    print(f"  Epochs: {epochs}")
    print(f"  Image size: {imgsz}")
    print(f"  Batch size: {batch}")
    print(f"  Device: {device}")
    
    # Train the model
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project='./models',
        name='droneaid',
        exist_ok=True,
        patience=20,  # Early stopping patience
        save=True,
        plots=True,
        verbose=True,
        val=True,
        # Augmentation parameters
        hsv_h=0.015,  # Image HSV-Hue augmentation
        hsv_s=0.7,    # Image HSV-Saturation augmentation
        hsv_v=0.4,    # Image HSV-Value augmentation
        degrees=15.0, # Image rotation (+/- deg)
        translate=0.1, # Image translation (+/- fraction)
        scale=0.5,    # Image scale (+/- gain)
        flipud=0.0,   # Image flip up-down (probability)
        fliplr=0.5,   # Image flip left-right (probability)
        mosaic=1.0,   # Image mosaic (probability)
    )
    
    # Validate the model
    print("\n" + "="*60)
    print("Validating trained model...")
    print("="*60)
    metrics = model.val()
    
    # Print metrics
    print("\nTraining Results:")
    print(f"  mAP50: {metrics.box.map50:.4f}")
    print(f"  mAP50-95: {metrics.box.map:.4f}")
    print(f"  Precision: {metrics.box.mp:.4f}")
    print(f"  Recall: {metrics.box.mr:.4f}")
    
    # Export to ONNX for inference
    print("\n" + "="*60)
    print("Exporting model to ONNX format...")
    print("="*60)
    
    best_model_path = Path('./models/droneaid/weights/best.pt')
    if best_model_path.exists():
        best_model = YOLO(best_model_path)
        onnx_path = best_model.export(format='onnx', imgsz=imgsz, simplify=True)
        print(f"\nModel exported successfully!")
        print(f"  PyTorch model: {best_model_path}")
        print(f"  ONNX model: {onnx_path}")
    else:
        print("Warning: Best model not found!")
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print("\nTo use the trained model:")
    print("  1. Copy the model files to the inference/models/ directory")
    print("  2. Start the inference service")
    print("  3. Access the web application")
    
    return results

if __name__ == '__main__':
    train_model()

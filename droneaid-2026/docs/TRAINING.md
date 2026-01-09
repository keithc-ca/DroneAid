# DroneAid 2026 - Training Guide

## Overview

This guide covers training the DroneAid symbol detection model using YOLOv8 in a Docker container.

## Prerequisites

- Docker installed and running
- 8GB+ RAM recommended
- GPU support optional but recommended for faster training

## Quick Start

### 1. Train with Default Settings

```bash
cd training
docker build -t droneaid-training .
docker run -v $(pwd)/data:/app/data -v $(pwd)/models:/app/models droneaid-training
```

This will:
1. Generate a synthetic dataset from the DroneAid icons
2. Train a YOLOv8 model for 100 epochs
3. Save the best model to `training/models/droneaid/weights/best.pt`
4. Export the model to ONNX format

### 2. Monitor Training

Training progress is logged to the console and TensorBoard files are saved to `models/droneaid/`.

To view TensorBoard:
```bash
pip install tensorboard
tensorboard --logdir training/models/droneaid
```

## Dataset Generation

The `prepare_data.py` script automatically generates a synthetic dataset by:

1. **Loading Icons**: Reads the 8 DroneAid symbols from `assets/icons/`
2. **Creating Backgrounds**: Generates varied backgrounds (solid, gradient, noisy textures)
3. **Augmentation**: Applies random transformations:
   - Rotation: ±30 degrees
   - Scale: 50-150% of original size
   - Position: Random placement on background
   - Lighting: Varied brightness and contrast
   - Blur: Occasional Gaussian blur

4. **YOLO Format**: Saves images and labels in YOLO format:
   - Images: `data/droneaid_dataset/images/train/` and `/val/`
   - Labels: `data/droneaid_dataset/labels/train/` and `/val/`

### Dataset Configuration

Default settings (modifiable in `prepare_data.py`):
- Images per class: 150 (120 train, 30 val)
- Total images: 1,200
- Image sizes: 640x480, 800x600, 1024x768, 1280x720
- Train/Val split: 80/20

## Custom Training

### Using Your Own Dataset

If you have real-world images with DroneAid symbols:

1. **Prepare images** in YOLO format:
```
data/custom_dataset/
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

2. **Create dataset.yaml**:
```yaml
path: /app/data/custom_dataset
train: images/train
val: images/val
nc: 8
names: ['children', 'elderly', 'firstaid', 'food', 'ok', 'shelter', 'sos', 'water']
```

3. **Modify train.py** to use your dataset:
```python
data_yaml = './data/custom_dataset/dataset.yaml'
```

### Adjusting Training Parameters

Edit `train.py` to modify:

```python
epochs = 100       # Number of training epochs
imgsz = 640        # Input image size
batch = 16         # Batch size (adjust for your GPU memory)
```

Model sizes (tradeoff between speed and accuracy):
- `yolov8n.pt` - Nano (fastest, smallest)
- `yolov8s.pt` - Small
- `yolov8m.pt` - Medium
- `yolov8l.pt` - Large
- `yolov8x.pt` - Extra Large (most accurate)

### Using GPU

The training script automatically detects and uses GPU if available. For Docker GPU support:

```bash
# Build with GPU support
docker build -t droneaid-training-gpu .

# Run with GPU
docker run --gpus all \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  droneaid-training-gpu
```

## Model Evaluation

After training, evaluate the model:

```python
from ultralytics import YOLO

model = YOLO('./models/droneaid/weights/best.pt')
metrics = model.val()

print(f"mAP50: {metrics.box.map50}")
print(f"mAP50-95: {metrics.box.map}")
```

### Key Metrics

- **mAP50**: Mean Average Precision at IoU threshold 0.5
- **mAP50-95**: mAP averaged over IoU thresholds 0.5 to 0.95
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)

Target metrics for DroneAid:
- mAP50: > 0.95 (symbols are distinct and well-defined)
- mAP50-95: > 0.85
- Precision: > 0.90
- Recall: > 0.90

## Testing the Model

Test on individual images:

```python
from ultralytics import YOLO

model = YOLO('./models/droneaid/weights/best.pt')
results = model('path/to/test/image.jpg')

# Display results
results[0].show()

# Save annotated image
results[0].save('result.jpg')
```

## Export Formats

The model is automatically exported to ONNX format for inference. Additional export options:

```python
model = YOLO('./models/droneaid/weights/best.pt')

# ONNX (default)
model.export(format='onnx')

# TensorFlow
model.export(format='saved_model')

# TensorFlow Lite
model.export(format='tflite')

# CoreML (iOS)
model.export(format='coreml')
```

## Troubleshooting

### Out of Memory

Reduce batch size:
```python
batch = 8  # or smaller
```

### Poor Performance

1. **More training data**: Increase `num_images_per_class` in `prepare_data.py`
2. **Longer training**: Increase `epochs`
3. **Larger model**: Use `yolov8m.pt` or `yolov8l.pt`
4. **Data augmentation**: Adjust augmentation parameters in `train.py`

### Model Not Converging

- Check dataset quality and labels
- Reduce learning rate
- Increase patience for early stopping
- Try different model architecture

## Advanced Topics

### Transfer Learning

Fine-tune on a pre-trained model:

```python
# Start with COCO-pretrained weights
model = YOLO('yolov8n.pt')

# Fine-tune on DroneAid
model.train(
    data='./data/droneaid_dataset/dataset.yaml',
    epochs=50,  # Fewer epochs needed
    freeze=10   # Freeze first 10 layers
)
```

### Hyperparameter Tuning

Automatically find best hyperparameters:

```python
model = YOLO('yolov8n.pt')
model.tune(
    data='./data/droneaid_dataset/dataset.yaml',
    iterations=300
)
```

## Next Steps

After training:
1. Copy the best model to `inference/models/`
2. Start the inference service
3. Test with the web application
4. Deploy to production environment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.

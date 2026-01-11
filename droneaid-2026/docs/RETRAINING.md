# DroneAid 2026 - Model Retraining Guide

## Why Retrain?

The model has been enhanced with new training features to improve detection of faded or washed-out icons. The improvements include:

### Color Degradation Simulation
Real-world DroneAid icons can fade due to:
- Sun exposure (UV degradation)
- Weather conditions (rain, wind)
- Aging materials
- Poor printing quality

The enhanced training simulates these conditions so the model learns to detect icons even when colors are faded.

### Shape-Based Detection
Instead of relying solely on color, the model now learns:
- Icon shape patterns
- Edge features
- Structural characteristics

This makes detection more robust when colors are unreliable.

### Weather Effects
Training includes simulation of:
- Fog and haze (reduced visibility)
- Sun glare (overexposed areas)
- Various lighting conditions

## Quick Retrain

### 1. Navigate to Training Directory

```bash
cd /Users/krook/dev/DroneAid/droneaid-2026/training
```

### 2. Build Training Container

```bash
docker build -t droneaid-training .
```

### 3. Run Training

```bash
docker run -v $(pwd)/data:/app/data -v $(pwd)/models:/app/models droneaid-training
```

This will:
1. Generate an enhanced synthetic dataset (1,200 images)
   - 50% with color degradation
   - 30% with weather effects
   - 20% with edge enhancement
2. Train YOLOv8 for 100 epochs
3. Export the best model to ONNX format

Training takes approximately:
- **With GPU**: 20-30 minutes
- **Without GPU**: 2-3 hours

## Deploy the New Model

### 1. Copy Model Files

After training completes, copy the model to the inference service:

```bash
# Copy the ONNX model
cp training/models/droneaid/weights/best.onnx inference/models/droneaid.onnx

# Or copy the PyTorch model
cp training/models/droneaid/weights/best.pt inference/models/droneaid.pt
```

### 2. Rebuild Inference Container

```bash
cd /Users/krook/dev/DroneAid/droneaid-2026
docker compose build inference
docker compose up -d
```

### 3. Test the Model

Open the web application at http://localhost:3000 and test with:

1. **Webcam feed** - Test real-time detection
2. **Image upload** - Upload test images with:
   - Normal colored icons
   - Faded/washed-out icons
   - Low-contrast images
   - Images with weather effects

## Expected Improvements

After retraining with the enhanced dataset, you should see:

### Better Detection Of:
- ✅ Faded icons with reduced color saturation
- ✅ Sun-bleached icons with washed-out colors
- ✅ Icons in foggy or hazy conditions
- ✅ Overexposed images (sun glare)
- ✅ Low-contrast scenarios
- ✅ Partially visible icons (shape-based recognition)

### Maintained Performance On:
- ✅ Bright, well-colored icons
- ✅ Various rotations and scales
- ✅ Different backgrounds
- ✅ Multiple lighting conditions

## Training Parameters

You can adjust training parameters in [train.py](../training/train.py):

```python
epochs = 100       # Number of training epochs (increase for better accuracy)
imgsz = 640        # Input image size
batch = 16         # Batch size (adjust for GPU memory)
```

Dataset parameters in [prepare_data.py](../training/prepare_data.py):

```python
num_images_per_class = 150  # Images per class (increase for more variety)

# Color degradation probability (line ~62)
if random.random() < 0.5:  # 50% of images - adjust as needed

# Weather effects probability (line ~97)  
if random.random() < 0.3:  # 30% of images - adjust as needed

# Edge enhancement probability (line ~126)
if random.random() < 0.2:  # 20% of images - adjust as needed
```

## Monitoring Training

View TensorBoard metrics during training:

```bash
pip install tensorboard
tensorboard --logdir training/models/droneaid
```

Open http://localhost:6006 to see:
- Training/validation loss curves
- Precision and recall metrics
- mAP (mean Average Precision) scores
- Learning rate schedules

## Troubleshooting

### Out of Memory (OOM)

Reduce batch size in `train.py`:

```python
batch = 8  # or even 4 for limited GPU memory
```

### Low Accuracy

Try these adjustments:

1. **Increase training data**:
   ```python
   num_images_per_class = 200  # or 250
   ```

2. **Train longer**:
   ```python
   epochs = 150  # or 200
   ```

3. **Use a larger model**:
   ```python
   model = YOLO('yolov8s.pt')  # Small instead of nano
   # or 'yolov8m.pt' for medium
   ```

### Model Not Detecting Faded Icons

Increase color degradation percentage:

```python
# In prepare_data.py, line ~62
if random.random() < 0.7:  # 70% instead of 50%
```

Or reduce minimum saturation:

```python
saturation_factor = random.uniform(0.2, 0.6)  # More extreme fading
```

## Advanced: Transfer Learning

Start from your current trained model instead of pre-trained COCO weights:

```python
# In train.py
model = YOLO('./models/droneaid/weights/best.pt')  # Use existing model

# Fine-tune with fewer epochs
epochs = 50
```

This is useful for:
- Adding new training variations without losing existing knowledge
- Quick retraining with updated dataset
- Incremental improvements

## Next Steps

After successful retraining and deployment:

1. **Test extensively** with real drone footage or images
2. **Collect edge cases** where detection fails
3. **Add those to training set** and retrain
4. **Iterate** to continuously improve

See [TRAINING.md](TRAINING.md) for more detailed training information.

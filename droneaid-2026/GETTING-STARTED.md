# Getting Started with DroneAid 2026

This guide will help you set up and run DroneAid 2026 in under 10 minutes.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **8GB RAM** minimum (16GB recommended for training)
- **Internet connection** (for downloading dependencies)

### Install Docker

If you don't have Docker installed:

- **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

Verify installation:

```bash
docker --version
docker-compose --version
```

## Quick Start (Automated)

The fastest way to get started:

```bash
cd droneaid-2026
./quickstart.sh
```

This script will:

1. Train the model (30-60 minutes first time)
2. Build Docker containers
3. Start all services
4. Open the application

Once complete, access:

- **Web App**: <http://localhost:3000>
- **API**: <http://localhost:8000/docs>

## Manual Setup

If you prefer to run each step manually:

### Step 1: Train the Model

```bash
cd training

# Build training container
docker build -t droneaid-training .

# Run training (creates synthetic dataset and trains model)
docker run \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  droneaid-training
```

**Note**: Training takes 30-60 minutes on CPU, 5-15 minutes on GPU.

### Step 2: Copy Model to Inference

```bash
# From droneaid-2026 directory
cp training/models/droneaid/weights/best.pt inference/models/
```

### Step 3: Start Services

```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d
```

### Step 4: Access the Application

Open your browser:

- **Web Application**: <http://localhost:3000>
- **API Documentation**: <http://localhost:8000/docs>
- **Health Check**: <http://localhost:8000/health>

## Using the Application

### Web Interface

1. **Open** <http://localhost:3000>
2. **Start Webcam** - Click the "Start Webcam" button (left side)
3. **Enable Detection** - Toggle "Prediction" on (center)
4. **Adjust Confidence** - Use slider to set minimum confidence threshold (0.1-1.0)
5. **Show Symbols** - Display DroneAid symbols to your camera
6. **View Results**:
   - **Left Panel**: Live webcam feed with bounding boxes drawn on detected symbols
   - **Right Panel**: List of detected symbols with confidence percentages
7. **Stop When Done** - Click "Stop Webcam" to release camera

### Testing with Symbol Images

Print or display symbols from `assets/icons/`:

- icon-sos.png
- icon-water.png
- icon-food.png
- icon-shelter.png
- icon-firstaid.png
- icon-children.png
- icon-elderly.png
- icon-ok.png

### API Testing

Test the API directly:

```bash
# Health check
curl http://localhost:8000/health

# Get supported classes
curl http://localhost:8000/classes

# Detect symbols in an image
curl -X POST "http://localhost:8000/detect" \
  -F "file=@assets/icons/icon-sos.png" \
  | jq
```

## Development Workflow

### Local Development (No Docker)

For faster iteration during development:

**Inference Service**:

```bash
cd inference
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Web Application**:

```bash
cd webapp
npm install
npm run dev
```

### Testing Different Models

To test a different model:

```bash
# Copy your model
cp /path/to/your/model.pt inference/models/

# Update docker-compose.yml or set environment variable
export MODEL_PATH=/app/models/your-model.pt

# Restart inference service
docker-compose restart inference
```

## Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f inference
docker-compose logs -f webapp
```

### Stop Services

```bash
docker-compose down

# Remove volumes too
docker-compose down -v
```

### Rebuild After Changes

```bash
docker-compose up --build
```

### Access Training Metrics

View TensorBoard logs:

```bash
pip install tensorboard
tensorboard --logdir training/models/droneaid
```

Open <http://localhost:6006>

## Troubleshooting

### Model Not Found

**Problem**: Inference API returns "Model not loaded"

**Solution**:

```bash
# Ensure model exists
ls inference/models/best.pt

# If missing, copy from training
cp training/models/droneaid/weights/best.pt inference/models/

# Restart service
docker-compose restart inference
```

### Port Already in Use

**Problem**: Port 3000 or 8000 already in use

**Solution**: Change ports in `docker-compose.yml`:

```yaml
services:
  inference:
    ports:
      - "8001:8000"  # Changed from 8000
  webapp:
    ports:
      - "3001:3000"  # Changed from 3000
```

### Out of Memory During Training

**Problem**: Docker runs out of memory

**Solution**: Increase Docker memory limit:

- Docker Desktop → Settings → Resources → Memory → Set to 8GB+

Or reduce batch size in `training/train.py`:

```python
batch = 8  # Reduced from 16
```

### Webcam Not Working

**Problem**: Browser can't access webcam

**Solutions**:

1. Grant browser camera permissions
2. Use HTTPS (required by some browsers)
3. Try different browser (Chrome recommended)

### Detection Not Working

**Problem**: No symbols detected

**Solutions**:

1. Lower confidence threshold (default 0.5 → 0.3)
2. Ensure good lighting
3. Hold symbol steady and clearly visible
4. Check API logs: `docker-compose logs inference`

## Next Steps

- **Customize Training**: See [docs/TRAINING.md](docs/TRAINING.md) for custom datasets
- **Integrate API**: See [docs/API.md](docs/API.md) for REST API integration
- **View Logs**: Use `docker-compose logs -f` to monitor services
- **Contribute**: See [CONTRIBUTING.md](../CONTRIBUTING.md) in parent directory

## Getting Help

- **Documentation**: [docs/](docs/)
- **Issues**: <https://github.com/Call-for-Code/DroneAid/issues>
- **Community**: <https://developer.ibm.com/callforcode/>

## Performance Tips

1. **GPU Training**: 10x faster - see [docs/TRAINING.md](docs/TRAINING.md)
2. **Model Size**: Use `yolov8n` for speed, `yolov8m` for accuracy
3. **Confidence Threshold**: Adjust based on use case (0.3-0.7)
4. **Image Size**: 640px optimal for realtime, 1280px for accuracy

## What's Next?

Once DroneAid 2026 is running:

1. **Test with real symbols** - Print icons from `assets/icons/` and test detection
2. **Try the API** - Send images to <http://localhost:8000/detect>
3. **Adjust settings** - Experiment with confidence thresholds
4. **Train on custom data** - Use your own images (see [docs/TRAINING.md](docs/TRAINING.md))
5. **Integrate** - Use the REST API in your applications

## Tips for Best Results

- **Good Lighting**: Ensure symbols are well-lit
- **Clear View**: Hold symbols steady and fully visible
- **Distance**: Keep symbols 1-3 feet from camera
- **Threshold**: Lower to 0.3-0.4 for harder-to-detect symbols
- **Multiple Symbols**: System can detect multiple symbols simultaneously

Enjoy using DroneAid 2026! 🚁

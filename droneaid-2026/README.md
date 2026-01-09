# DroneAid 2026 - Modern Implementation

<img src="assets/images/droneaid-logo.png" height="100" alt="DroneAid logo">

A modernized implementation of DroneAid using cutting-edge technologies, containerized workflows, and enhanced mapping capabilities.

## Overview

DroneAid 2026 is a complete reimplementation of the DroneAid disaster response system, featuring:

- **Modern ML Stack**: YOLOv8-based object detection for superior accuracy
- **Full Containerization**: Docker-based training and inference for easy deployment
- **Enhanced UI**: React with Carbon Design System for a professional interface
- **Integrated Mapping**: Real-time visualization of detected symbols on interactive maps
- **Cloud-Ready**: Designed for local development and cloud deployment

## Architecture

```
droneaid-2026/
├── assets/           # Icons, images, and static resources
├── training/         # Model training environment (Docker)
├── inference/        # Model serving API (Docker)
├── webapp/           # React frontend with Carbon Design System
├── docker/           # Docker compose and configurations
└── docs/             # Documentation
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- 8GB+ RAM recommended for training
- Webcam (for live detection testing)

### Automated Setup (Recommended)

```bash
./quickstart.sh
```

This script will:

1. Train the YOLOv8 model (30-60 minutes)
2. Build Docker containers
3. Start all services
4. Verify system health

Access the app at <http://localhost:3000>

### Manual Setup

**1. Train the Model**

```bash
# Build from root directory (needs access to assets/)
docker build -f training/Dockerfile -t droneaid-training .
docker run -v $(pwd)/training/data:/app/data -v $(pwd)/training/models:/app/models droneaid-training
```

**2. Start All Services**

```bash
docker-compose up -d
```

The system will:

- Start inference API on <http://localhost:8000>
- Start web application on <http://localhost:3000>
- Automatically use the trained model

## Features

### Real-Time Symbol Detection

- **Live Webcam Feed**: Real-time detection from your camera
- **YOLOv8 Accuracy**: State-of-the-art object detection
- **Bounding Boxes**: Visual overlay showing detected symbols
- **Confidence Scores**: Adjustable threshold (default 60%)
- **Multiple Symbols**: Detects all 8 disaster response symbols simultaneously
- **5 FPS Detection**: Optimized for real-time performance

### Modern Web Interface

- **Carbon Design System**: Professional IBM design language
- **Responsive Layout**: Works on desktop and tablet
- **Live Detection Panel**: Real-time list of detected symbols with confidence
- **Video Controls**: Start/stop webcam, toggle detection on/off
- **Adjustable Settings**: Confidence threshold slider

### Symbols Supported

- 🆘 SOS - Immediate Help Needed
- ✅ OK - No Help Needed
- 💧 Water - Water Needed
- 🍽️ Food - Food Needed
- 🏠 Shelter - Shelter Needed
- 🏥 First Aid - Medical Supplies Needed
- 👶 Children - Area with Children
- 👴 Elderly - Area with Elderly

## Training Your Own Model

See [docs/TRAINING.md](docs/TRAINING.md) for detailed instructions on:

- Preparing custom datasets
- Configuring training parameters
- Fine-tuning the model
- Evaluating performance

## Deployment

The Docker Compose setup is production-ready for local or server deployment:

```bash
# Production deployment
docker-compose up -d
```

For cloud deployment, the containerized architecture supports:

- AWS (ECS, ECR)
- Google Cloud (Cloud Run, GCR)
- Azure (Container Instances, ACR)
- Kubernetes clusters

See individual Dockerfiles for configuration options.

## Technology Stack

### Training

- **YOLOv8** (Ultralytics) - State-of-the-art object detection
- **Python 3.11** - Latest stable Python
- **PyTorch 2.x** - Modern deep learning framework
- **Docker** - Containerized training environment

### Inference

- **FastAPI** - High-performance Python API framework
- **ONNX Runtime** - Optimized model inference
- **OpenCV** - Image processing
- **Docker** - Containerized inference service

### Web Application

- **React 18** - Modern UI framework
- **Carbon Design System** - IBM's open-source design system
- **Leaflet** - Interactive mapping library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tooling

## Development

### Project Structure

```
droneaid-2026/
├── assets/
│   ├── icons/              # Symbol images (8 disaster icons)
│   └── images/             # Logo and UI assets
├── training/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── train.py            # Training script
│   ├── prepare_data.py     # Dataset preparation
│   └── data/               # Training data (auto-generated)
├── inference/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py             # FastAPI server
│   ├── model.py            # Model loading and inference
│   └── models/             # Trained models
├── webapp/
│   ├── package.json
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API clients
│   │   ├── App.tsx         # Main app component
│   │   └── index.tsx       # Entry point
│   └── public/             # Static assets
├── docker/
│   └── docker-compose.yml  # Multi-container setup
└── docs/
    ├── TRAINING.md         # Training guide
    ├── DEPLOYMENT.md       # Deployment guide
    └── API.md              # API documentation
```

## Contributing

DroneAid 2026 is part of the Call for Code initiative. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache 2.0 - See [LICENSE](../LICENSE) for details.

## Acknowledgments

- Original DroneAid concept by Pedro Cruz
- Built for Call for Code with The Linux Foundation
- Carbon Design System by IBM
- Ultralytics YOLOv8 framework

## Support

- GitHub Issues: <https://github.com/Call-for-Code/DroneAid/issues>
- Documentation: [docs/](docs/)
- Call for Code Community: <https://developer.ibm.com/callforcode/>

---

**Note**: This is a modernized implementation. For the original version, see the parent directory.

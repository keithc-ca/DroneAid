#!/bin/bash

# DroneAid 2026 - Quick Start Script
# This script sets up and runs the complete DroneAid system

set -e  # Exit on error

echo "=========================================="
echo "DroneAid 2026 - Quick Start"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✓ Docker found"

# Check Docker Compose (supports both modern plugin and legacy standalone)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✓ Docker Compose found (plugin)"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "✓ Docker Compose found (standalone)"
else
    echo "Error: Docker Compose is not installed."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi
echo ""

# Step 1: Train the model
echo "=========================================="
echo "Step 1: Training Model"
echo "=========================================="
echo ""

if [ ! -f "training/models/droneaid/weights/best.pt" ]; then
    echo "No trained model found. Starting training..."
    echo "This may take 30-60 minutes depending on your hardware."
    echo ""
    
    # Build training image (from parent directory to access assets)
    echo "Building training Docker image..."
    docker build -f training/Dockerfile -t droneaid-training .
    
    # Run training
    echo "Starting model training..."
    docker run -v $(pwd)/training/data:/app/data -v $(pwd)/training/models:/app/models droneaid-training
    
    echo ""
    echo "✓ Model training complete!"
else
    echo "✓ Trained model found, skipping training"
fi

echo ""

# Step 2: Copy model to inference directory
echo "=========================================="
echo "Step 2: Preparing Inference Service"
echo "=========================================="
echo ""

mkdir -p inference/models
if [ -f "training/models/droneaid/weights/best.pt" ]; then
    cp training/models/droneaid/weights/best.pt inference/models/
    echo "✓ Model copied to inference directory"
else
    echo "Error: Model not found after training"
    exit 1
fi

echo ""

# Step 3: Start services with Docker Compose
echo "=========================================="
echo "Step 3: Starting Services"
echo "=========================================="
echo ""

echo "Building and starting all services..."
$DOCKER_COMPOSE up --build -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "Checking service status..."

# Check inference API
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✓ Inference API is running"
else
    echo "⚠ Inference API may not be ready yet"
fi

# Check webapp
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Web application is running"
else
    echo "⚠ Web application may not be ready yet"
fi

echo ""
echo "=========================================="
echo "DroneAid 2026 is Ready!"
echo "=========================================="
echo ""
echo "Access the application:"
echo "  Web App: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo "  API Health: http://localhost:8000/health"
echo ""
echo "To view logs:"
echo "  $DOCKER_COMPOSE logs -f"
echo ""
echo "To stop services:"
echo "  $DOCKER_COMPOSE down"
echo ""
echo "For more information, see README.md"
echo ""

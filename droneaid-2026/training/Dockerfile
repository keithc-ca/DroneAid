FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY training/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy assets (icons)
COPY assets /app/assets

# Copy training scripts
COPY training/*.py .

# Create directories for data and models
RUN mkdir -p /app/data /app/models

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the training script
CMD ["python", "train.py"]

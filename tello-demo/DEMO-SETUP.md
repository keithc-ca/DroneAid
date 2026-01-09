# DroneAid Local Demo Setup

## Overview
This setup allows you to run DroneAid locally without a physical Tello drone by using your webcam to test the machine learning model.

## What's Been Done

### 1. Dependencies Updated
- Updated `ws` from 7.5.10 to 8.19.0
- All security vulnerabilities fixed
- FFmpeg installed (required for video processing)

### 2. New Files Created

#### `server-demo.js`
A simplified server that doesn't require a physical drone. It:
- Serves the web interface on http://127.0.0.1:5000
- Provides mock battery status
- Sends simulated drone state data
- Works entirely in demo mode

#### `public/demo.html`
A webcam-based demo interface that:
- Uses your computer's webcam instead of drone video
- Runs the DroneAid ML model on the webcam feed
- Detects DroneAid symbols in real-time
- Shows bounding boxes and confidence scores

### 3. Package.json Updated
Added a new npm script:
```json
"demo": "node server-demo.js"
```

## How to Run

### Start the Demo Server
```bash
cd tello-demo
npm run demo
```

The server will start on http://127.0.0.1:5000

### Access the Demo
Open your browser to:
- **Demo Mode (Webcam)**: http://127.0.0.1:5000/demo.html
- **Original Interface**: http://127.0.0.1:5000/ (requires physical drone)

### Using the Demo

1. **Open the demo page** - Navigate to http://127.0.0.1:5000/demo.html

2. **Start your webcam** - Click the "📹 Start Webcam" button

3. **Enable predictions** - Toggle the "Prediction" switch to "On"

4. **Test with symbols** - Show DroneAid symbols to your webcam:
   - Print the symbols from `img/icons/`
   - Display them on another screen
   - Draw them on paper

5. **Adjust confidence** - Use the "Min Confidence Level" slider to filter detections

## DroneAid Symbols

The model is trained to detect these symbols:

| Symbol | Meaning |
|--------|---------|
| SOS | Immediate Help Needed |
| OK | No Help Needed |
| Water | Water Needed |
| Food | Food Needed |
| Shelter | Shelter Needed |
| First Aid | First Aid Kit Needed |
| Children | Area with Children in Need |
| Elderly | Area with Elderly in Need |

Symbol images are located in the `img/icons/` directory.

## Technical Details

### Server Architecture
- **Express.js** - Web server
- **WebSocket** - Real-time communication
- **TensorFlow.js** - ML model inference
- **FFmpeg** - Video processing (for drone mode)

### Model
- Pre-trained object detection model in `tello-demo/public/model_web/`
- Uses TensorFlow.js for browser-based inference
- Detects and classifies DroneAid symbols

### Demo vs. Drone Mode

**Demo Mode** (`npm run demo`):
- No drone required
- Uses webcam
- Simplified server
- Great for development and testing

**Drone Mode** (`npm start`):
- Requires physical Tello drone
- Connects via WiFi
- Receives UDP video stream
- Full drone control capabilities

## Troubleshooting

### Camera not working
- Check browser permissions for camera access
- Try a different browser (Chrome/Edge work best)
- Ensure no other app is using the camera

### Model not loading
- Check console for errors
- Verify `public/model_web/` contains model files
- Ensure the object-detection.js library loaded

### Low FPS / Laggy
- Lower the video resolution
- Close other browser tabs
- Disable other apps using CPU/GPU

## Next Steps

To use with a real Tello drone:
1. Connect your computer to the Tello drone's WiFi
2. Run `npm start` instead of `npm run demo`
3. Open http://127.0.0.1:5000/
4. Click "Start stream"

## Testing the Model

For best results:
1. Ensure good lighting
2. Hold symbols steady in front of camera
3. Start with high-contrast printed symbols
4. Adjust confidence threshold based on results
5. The model works best with clear, unobstructed symbols

## Resources

- Main README: `README.md`
- Setup Guide: `SETUP.md`
- Symbol Icons: `img/icons/`
- GitHub: https://github.com/Call-for-Code/DroneAid

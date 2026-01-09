import { useEffect, useRef, useState } from 'react';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  Content,
  Toggle,
  Slider,
  Button,
  Tag,
  Tile
} from '@carbon/react';
import { Video, VideoOff } from '@carbon/icons-react';
import '@carbon/styles/css/styles.css';
import './App.scss';

interface Detection {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPredictionRef = useRef<number>(0);
  const isPredictionEnabledRef = useRef<boolean>(false);
  const modelLoadedRef = useRef<boolean>(false);

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isPredictionEnabled, setIsPredictionEnabled] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep refs in sync with state
  useEffect(() => {
    isPredictionEnabledRef.current = isPredictionEnabled;
  }, [isPredictionEnabled]);

  useEffect(() => {
    modelLoadedRef.current = modelLoaded;
  }, [modelLoaded]);

  // Load model on mount
  useEffect(() => {
    loadModel();
    return () => {
      stopWebcam();
    };
  }, []);

  const loadModel = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setModelLoaded(true);
      } else {
        throw new Error('Inference API not available');
      }
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsWebcamActive(true);
        
        videoRef.current.onloadedmetadata = () => {
          renderFrame();
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsWebcamActive(false);
    setDetections([]);
  };

  const renderFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!video || !canvas || !ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, 640, 480);

    // Run predictions if enabled (throttle to max 5 per second)
    const now = Date.now();
    
    if (isPredictionEnabledRef.current && modelLoadedRef.current && !isProcessing && now - lastPredictionRef.current > 200) {
      lastPredictionRef.current = now;
      runPrediction(canvas);
    } else if (!isPredictionEnabledRef.current) {
      // Clear detection overlay
      const detectionCanvas = detectionCanvasRef.current;
      const detectionCtx = detectionCanvas?.getContext('2d');
      if (detectionCtx) {
        detectionCtx.clearRect(0, 0, 640, 480);
      }
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const runPrediction = async (canvas: HTMLCanvasElement) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
      });

      // Send to inference API
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Detection failed');
      }

      const result = await response.json();
      const predictions: Detection[] = result.detections || [];

      // Filter by confidence
      const filtered = predictions.filter(p => p.confidence >= confidenceThreshold);
      setDetections(filtered);

      // Draw bounding boxes
      drawDetections(filtered);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const drawDetections = (predictions: Detection[]) => {
    const detectionCanvas = detectionCanvasRef.current;
    const detectionCtx = detectionCanvas?.getContext('2d');
    
    if (!detectionCtx) return;

    // Clear previous detections
    detectionCtx.clearRect(0, 0, 640, 480);

    // Draw bounding boxes
    detectionCtx.strokeStyle = '#0f62fe';
    detectionCtx.lineWidth = 3;
    detectionCtx.font = '16px IBM Plex Sans';
    detectionCtx.fillStyle = '#0f62fe';

    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;

      // Draw box
      detectionCtx.strokeRect(x, y, width, height);

      // Draw label background
      const label = `${prediction.class_name} ${(prediction.confidence * 100).toFixed(0)}%`;
      const metrics = detectionCtx.measureText(label);
      detectionCtx.fillStyle = '#0f62fe';
      detectionCtx.fillRect(x, y - 24, metrics.width + 10, 24);

      // Draw label text
      detectionCtx.fillStyle = '#ffffff';
      detectionCtx.fillText(label, x + 5, y - 8);
    });
  };

  // Update render loop when prediction is toggled
  useEffect(() => {
    if (isWebcamActive && !animationFrameRef.current) {
      renderFrame();
    }
  }, [isPredictionEnabled, confidenceThreshold]);

  return (
    <div className="app">
      <Header aria-label="DroneAid 2026">
        <HeaderName href="#" prefix="DroneAid">
          2026 Demo
        </HeaderName>
        <HeaderGlobalBar>
          <span style={{ color: '#fff', fontSize: '0.875rem' }}>
            Symbol detection using webcam
          </span>
        </HeaderGlobalBar>
      </Header>

      <Content>

        <div className="controls-bar">
          <div className="control-group">
            {!isWebcamActive ? (
              <Button
                renderIcon={Video}
                onClick={startWebcam}
                disabled={!modelLoaded}
              >
                Start Webcam
              </Button>
            ) : (
              <Button
                kind="danger"
                renderIcon={VideoOff}
                onClick={stopWebcam}
              >
                Stop Webcam
              </Button>
            )}
          </div>

          <div className="control-group">
            <Toggle
              id="prediction-toggle"
              labelText="Prediction"
              labelA="Off"
              labelB="On"
              toggled={isPredictionEnabled}
              onToggle={(checked: boolean) => setIsPredictionEnabled(checked)}
              disabled={!isWebcamActive || !modelLoaded}
            />
          </div>

          <div className="control-group slider-group">
            <Slider
              id="confidence-slider"
              labelText="Min Confidence Level"
              min={0.1}
              max={1.0}
              step={0.05}
              value={confidenceThreshold}
              onChange={(e: { value: number }) => setConfidenceThreshold(e.value)}
              disabled={!isPredictionEnabled}
            />
          </div>
        </div>

        <div className="content-grid">
          <Tile className="video-section">
            <h3>Detected Stream</h3>
            <div className="video-container">
              <video
                ref={videoRef}
                width="640"
                height="480"
                autoPlay
                style={{ display: 'none' }}
              />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                className="output-canvas"
              />
              <canvas
                ref={detectionCanvasRef}
                width="640"
                height="480"
                className="detection-canvas"
              />
            </div>
            {!isWebcamActive && (
              <p className="webcam-tip">
                💡 Tip: Print or display DroneAid symbols and show them to your webcam to test the model!
              </p>
            )}
          </Tile>

          <Tile className="detections-section">
            <h3>Detected Symbols</h3>
            {detections.length > 0 ? (
                <div className="detection-list">
                  {detections.map((detection: Detection, idx: number) => (
                    <div key={idx} className="detection-item">
                      <Tag type="blue">{detection.class_name}</Tag>
                      <span className="confidence">
                        {(detection.confidence * 100).toFixed(1)}% confidence
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-detections">
                  {isPredictionEnabled
                    ? 'No symbols detected above threshold.'
                    : 'Enable prediction and show symbols to the camera.'}
                </p>
              )}
          </Tile>
        </div>
      </Content>
    </div>
  );
}

export default App;

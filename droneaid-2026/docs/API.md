# DroneAid 2026 - API Documentation

## Base URL

Local development: `http://localhost:8000`

## Endpoints

### Health Check

Check API and model status.

**GET** `/health`

**Response**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_path": "/app/models/best.pt"
}
```

### Get Classes

Get list of detectable symbol classes.

**GET** `/classes`

**Response**
```json
{
  "classes": [
    "children",
    "elderly",
    "firstaid",
    "food",
    "ok",
    "shelter",
    "sos",
    "water"
  ],
  "count": 8
}
```

### Detect from Image File

Detect DroneAid symbols in an uploaded image file.

**POST** `/detect`

**Parameters**
- `file` (form-data, required): Image file (JPEG, PNG)
- `conf_threshold` (query, optional): Confidence threshold 0.0-1.0 (default: 0.5)

**Request**
```bash
curl -X POST "http://localhost:8000/detect?conf_threshold=0.6" \
  -F "file=@image.jpg"
```

**Response**
```json
{
  "detections": [
    {
      "class_name": "sos",
      "confidence": 0.92,
      "bbox": [120.5, 80.3, 150.2, 180.7]
    },
    {
      "class_name": "water",
      "confidence": 0.87,
      "bbox": [450.1, 200.5, 140.8, 165.3]
    }
  ],
  "image_width": 1280,
  "image_height": 720,
  "processing_time_ms": 45.23
}
```

### Detect from Base64 Image

Detect symbols in a base64-encoded image.

**POST** `/detect/base64`

**Body** (JSON)
```json
{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "conf_threshold": 0.5
}
```

**Response**
Same format as `/detect` endpoint.

## Data Models

### Detection Object

```typescript
interface Detection {
  class_name: string;      // Symbol class name
  confidence: number;      // Confidence score (0.0-1.0)
  bbox: number[];          // Bounding box [x, y, width, height]
}
```

### Detection Response

```typescript
interface DetectionResponse {
  detections: Detection[];    // Array of detected symbols
  image_width: number;        // Original image width
  image_height: number;       // Original image height
  processing_time_ms: number; // Processing time in milliseconds
}
```

## Symbol Classes

| Class | Description | Icon |
|-------|-------------|------|
| `children` | Area with Children in Need | 👶 |
| `elderly` | Area with Elderly in Need | 👴 |
| `firstaid` | First Aid/Medical Supplies Needed | 🏥 |
| `food` | Food Needed | 🍽️ |
| `ok` | No Help Needed | ✅ |
| `shelter` | Shelter Needed | 🏠 |
| `sos` | Immediate Help Needed | 🆘 |
| `water` | Water Needed | 💧 |

## Example Usage

### Python

```python
import requests

# Upload image file
with open('disaster_scene.jpg', 'rb') as f:
    files = {'file': f}
    params = {'conf_threshold': 0.6}
    response = requests.post('http://localhost:8000/detect', files=files, params=params)
    
detections = response.json()
print(f"Found {len(detections['detections'])} symbols")

for det in detections['detections']:
    print(f"  - {det['class_name']}: {det['confidence']:.2f}")
```

### JavaScript

```javascript
// Upload image file
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/detect?conf_threshold=0.6', {
  method: 'POST',
  body: formData
});

const detections = await response.json();
console.log(`Found ${detections.detections.length} symbols`);
```

### cURL

```bash
# Detect from file
curl -X POST "http://localhost:8000/detect?conf_threshold=0.6" \
  -F "file=@image.jpg" \
  -H "accept: application/json"

# Health check
curl -X GET "http://localhost:8000/health"

# Get classes
curl -X GET "http://localhost:8000/classes"
```

## Error Responses

### 400 Bad Request

Invalid input (e.g., corrupted image, invalid base64).

```json
{
  "detail": "Invalid image file"
}
```

### 500 Internal Server Error

Server error during processing.

```json
{
  "detail": "Detection failed: Model not loaded"
}
```

## Performance

- **Average inference time**: 20-50ms per image (CPU)
- **GPU inference**: 5-15ms per image
- **Supported image sizes**: Up to 4096x4096 pixels
- **Batch processing**: Not currently supported (process images sequentially)

## Rate Limiting

No rate limiting in development. For production deployment, implement rate limiting based on your requirements.

## Interactive API Documentation

FastAPI provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to test API endpoints directly in your browser.

## WebSocket Support

WebSocket support for real-time video streams is planned for a future release.

## Best Practices

1. **Confidence Threshold**: Start with 0.5-0.6 for general use. Increase for high-precision requirements, decrease for high-recall scenarios.

2. **Image Preprocessing**: For best results:
   - Good lighting
   - Minimal occlusion
   - Image resolution: 640-1280px optimal
   - Supported formats: JPEG, PNG

3. **Error Handling**: Always check response status and handle errors gracefully.

4. **Caching**: Cache detection results for static images to reduce API calls.

## Support

For issues or questions:
- GitHub Issues: https://github.com/Call-for-Code/DroneAid/issues
- Documentation: [/docs](/docs)

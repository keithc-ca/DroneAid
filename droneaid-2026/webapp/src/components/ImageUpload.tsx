import { useState } from 'react';
import { Button } from '@carbon/react';
import { Upload } from '@carbon/icons-react';
import exifr from 'exifr';
import axios from 'axios';

interface Detection {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp?: number;
  location?: [number, number]; // [longitude, latitude]
}

interface ImageUploadProps {
  confidenceThreshold: number;
  onImageUpload: (imageUrl: string, detections: Detection[]) => void;
}

interface ExifData {
  latitude?: number;
  longitude?: number;
}

const ImageUpload = ({ confidenceThreshold, onImageUpload }: ImageUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Read EXIF data
        let gpsCoords: [number, number] | undefined;
        try {
          const exifData = await exifr.gps(file) as ExifData;
          if (exifData && exifData.latitude !== undefined && exifData.longitude !== undefined) {
            gpsCoords = [exifData.longitude, exifData.latitude];
            console.log(`GPS coordinates for ${file.name}:`, gpsCoords);
          } else {
            console.warn(`No GPS data found in ${file.name}`);
          }
        } catch (error) {
          console.warn(`Error reading EXIF from ${file.name}:`, error);
        }

        // Create object URL for display
        const imageUrl = URL.createObjectURL(file);

        // Send to inference API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conf_threshold', confidenceThreshold.toString());

        console.log('Sending to inference API with conf_threshold:', confidenceThreshold);

        try {
          const response = await axios.post('/api/detect', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          console.log('API response:', response.data);
          const detections: Detection[] = response.data.detections || [];
          
          // Add GPS coordinates to detections if available
          const detectionsWithLocation = detections.map(det => ({
            ...det,
            timestamp: Date.now(),
            location: gpsCoords
          }));

          // Notify parent component
          onImageUpload(imageUrl, detectionsWithLocation);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
        }
      }
    } finally {
      setIsProcessing(false);
      // Clear the input so the same file can be uploaded again
      event.target.value = '';
    }
  };

  return (
    <div className="image-upload">
      <input
        type="file"
        id="image-upload-input"
        accept="image/jpeg,image/jpg"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        kind="primary"
        renderIcon={Upload}
        onClick={() => document.getElementById('image-upload-input')?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Upload Image(s)'}
      </Button>
    </div>
  );
};

export default ImageUpload;

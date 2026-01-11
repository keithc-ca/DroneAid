import { useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut } from '@carbon/icons-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './DetectionMap.scss';

interface Detection {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp?: number;
  location?: [number, number]; // [longitude, latitude]
}

interface DetectionMapProps {
  detections: Detection[];
}

const DEFAULT_LATITUDE = 18.2208;  // Puerto Rico
const DEFAULT_LONGITUDE = -66.5901;
const DEFAULT_ZOOM = 8;  // Zoomed to show the island

// Mapbox access token from environment variable
// Get your token from https://account.mapbox.com/access-tokens/
// Set in webapp/.env file (see .env.example for template)
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

if (!MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file.');
}

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const DetectionMap = ({ detections }: DetectionMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; timeout: ReturnType<typeof setTimeout> }>>(new Map());
  const processedDetectionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [DEFAULT_LONGITUDE, DEFAULT_LATITUDE],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      })
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when detections change
  useEffect(() => {
    if (!map.current) return;

    console.log('DetectionMap received detections:', detections);

    // Add new markers for detections
    detections.forEach((detection) => {
      // Create a unique key using timestamp if available, otherwise use a random ID
      // This ensures we can track which detections have been processed
      const uniqueId = detection.timestamp || Date.now() + Math.random();
      const key = `${detection.class_name}-${uniqueId}`;
      
      // Skip if already processed
      if (processedDetectionsRef.current.has(key)) {
        console.log('Skipping already processed detection:', key);
        return;
      }
      processedDetectionsRef.current.add(key);
      console.log('Processing new detection:', key, detection);

      // Use GPS coordinates from EXIF if available, otherwise simulate location across Puerto Rico
      let lat: number, lng: number, locationSource: string;
      
      if (detection.location && detection.location[0] !== undefined && detection.location[1] !== undefined) {
        // Use real GPS coordinates from image EXIF
        lng = detection.location[0];
        lat = detection.location[1];
        locationSource = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } else {
        // Simulate location randomly across Puerto Rico for webcam stream
        // NOTE: This randomness is intentional for demo purposes and does not model a real drone path.
        lat = DEFAULT_LATITUDE + (Math.random() - 0.5) * 0.5;
        lng = DEFAULT_LONGITUDE + (Math.random() - 0.5) * 1.0;
        locationSource = 'Simulated location';
      }

      // Create a custom marker element using the marker image
      const el = document.createElement('div');
      el.className = 'detection-marker fade-in';
      el.style.cursor = 'pointer';
      el.style.width = '64px';
      el.style.height = '80px';

      const img = document.createElement('img');
      img.src = `/assets/markers/marker-${detection.class_name.toLowerCase()}.png`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
      el.appendChild(img);

      // Create popup content using DOM methods to prevent XSS
      const popupContent = document.createElement('div');
      popupContent.style.padding = '8px';

      const titleEl = document.createElement('strong');
      titleEl.textContent = detection.class_name;
      popupContent.appendChild(titleEl);
      popupContent.appendChild(document.createElement('br'));

      const confidenceEl = document.createElement('div');
      confidenceEl.textContent = `Confidence: ${(detection.confidence * 100).toFixed(1)}%`;
      popupContent.appendChild(confidenceEl);
      popupContent.appendChild(document.createElement('br'));

      const locationEl = document.createElement('small');
      locationEl.textContent = locationSource;
      popupContent.appendChild(locationEl);

      const popup = new mapboxgl.Popup({ offset: 40 }).setDOMContent(popupContent);

      // Add marker to map with anchor at bottom (where the pointer is)
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Set timeout to fade out after 5 seconds
      const timeout = setTimeout(() => {
        el.classList.remove('fade-in');
        el.classList.add('fade-out');
        
        // Remove marker after fade out completes
        setTimeout(() => {
          marker.remove();
          markersRef.current.delete(key);
          processedDetectionsRef.current.delete(key);
        }, 500); // Match fade-out duration
      }, 30000); // Display markers for 30 seconds

      markersRef.current.set(key, { marker, timeout });
    });
  }, [detections]);

  // Clean up all markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(({ marker, timeout }) => {
        clearTimeout(timeout);
        marker.remove();
      });
      markersRef.current.clear();
    };
  }, []);

  const zoomIn = () => {
    if (map.current) {
      map.current.flyTo({ zoom: map.current.getZoom() + 1 });
    }
  };

  const zoomOut = () => {
    if (map.current) {
      map.current.flyTo({ zoom: map.current.getZoom() - 1 });
    }
  };

  return (
    <div className="detection-map">
      <div className="detection-map__controls">
        <button
          className="map-control-button"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="map-control-button"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default DetectionMap;

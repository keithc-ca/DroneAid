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

const DEFAULT_LATITUDE = 37.7749;  // San Francisco
const DEFAULT_LONGITUDE = -122.4194;
const DEFAULT_ZOOM = 12;  // Zoomed to San Francisco city

// Symbol colors matching DroneAid theme
const SYMBOL_COLORS: { [key: string]: string } = {
  'children': '#cf8ffd',   // light purple
  'elderly': '#8c07ff',    // purple
  'firstaid': '#ffed10',   // yellow
  'food': '#e22b00',       // red-orange
  'ok': '#00ce08',         // green
  'shelter': '#00cbb3',    // teal
  'sos': '#ff6c00',        // orange
  'water': '#418fde'       // blue
};

// Mapbox access token from environment variable
// Get your token from https://account.mapbox.com/access-tokens/
// Set in webapp/.env file (see .env.example for template)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

const DetectionMap = ({ detections }: DetectionMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; timeout: number }>>(new Map());

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

    // Add new markers for detections
    detections.forEach((detection) => {
      // Simulate location randomly across San Francisco city
      const lat = DEFAULT_LATITUDE + (Math.random() - 0.5) * 0.08;
      const lng = DEFAULT_LONGITUDE + (Math.random() - 0.5) * 0.08;

      const color = SYMBOL_COLORS[detection.class_name.toLowerCase()] || '#ffffff';

      // Create a unique key for this detection instance
      const key = `${detection.class_name}-${Date.now()}-${Math.random()}`;

      // Create a custom marker element
      const el = document.createElement('div');
      el.className = 'detection-marker fade-in';
      el.style.backgroundColor = color;
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div style="padding: 8px;">
          <strong>${detection.class_name}</strong><br/>
          Confidence: ${(detection.confidence * 100).toFixed(1)}%<br/>
          <small>Simulated location</small>
        </div>`
      );

      // Add marker to map
      const marker = new mapboxgl.Marker(el)
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
        }, 500); // Match fade-out duration
      }, 5000);

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

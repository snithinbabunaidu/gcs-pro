import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TelemetryOverlay } from './TelemetryOverlay';
import styles from './MapView.module.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom drone icon
const droneIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#1976D2" stroke="#fff" stroke-width="2"/>
      <circle cx="20" cy="20" r="12" fill="#2196F3"/>
      <circle cx="20" cy="20" r="6" fill="#fff"/>
      <circle cx="20" cy="20" r="2" fill="#1976D2"/>
      <!-- Rotor indicators -->
      <circle cx="10" cy="10" r="3" fill="#FF5722" opacity="0.8"/>
      <circle cx="30" cy="10" r="3" fill="#FF5722" opacity="0.8"/>
      <circle cx="10" cy="30" r="3" fill="#FF5722" opacity="0.8"/>
      <circle cx="30" cy="30" r="3" fill="#FF5722" opacity="0.8"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

interface MapViewProps {
  position: [number, number];
  telemetry: {
    altitude: number;
    speed: number;
    battery: number;
    heading: number;
    status: string;
  };
  onVideoToggle: () => void;
}

// Component to update map center when drone position changes
const MapUpdater: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ position, telemetry, onVideoToggle }) => {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className={styles.mapViewContainer}>
      <MapContainer
        center={position}
        zoom={16}
        className={styles.map}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Satellite layer option */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          opacity={0.7}
        />
        
        <Marker position={position} icon={droneIcon}>
        </Marker>
        
        <MapUpdater position={position} />
      </MapContainer>

      {/* Telemetry Overlay */}
      <TelemetryOverlay {...telemetry} />

      {/* Video Picture-in-Picture */}
      <div className={styles.videoPip} onClick={onVideoToggle}>
        <div className={styles.pipHeader}>
          <span>LIVE FEED</span>
          <button className={styles.expandButton}>⛶</button>
        </div>
        <video 
          className={styles.videoElement}
          autoPlay 
          loop 
          muted
          playsInline
        >
          <source src="/drone-footage.mp4" type="video/mp4" />
          <div className={styles.videoPlaceholder}>
            <div className={styles.cameraIcon}>📹</div>
            <p>Camera Feed</p>
            <p className={styles.feedStatus}>● LIVE</p>
          </div>
        </video>
      </div>

      {/* Map Controls */}
      <div className={styles.mapControls}>
        <button 
          className={styles.controlButton}
          onClick={() => mapRef.current?.setView(position, 16)}
          title="Center on Drone"
        >
          🎯
        </button>
        <button 
          className={styles.controlButton}
          onClick={() => mapRef.current?.zoomIn()}
          title="Zoom In"
        >
          +
        </button>
        <button 
          className={styles.controlButton}
          onClick={() => mapRef.current?.zoomOut()}
          title="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Flight Path Toggle */}
      <div className={styles.layerControls}>
        <label className={styles.layerToggle}>
          <input type="checkbox" defaultChecked />
          <span>Show Flight Path</span>
        </label>
        <label className={styles.layerToggle}>
          <input type="checkbox" />
          <span>Satellite View</span>
        </label>
      </div>
    </div>
  );
};
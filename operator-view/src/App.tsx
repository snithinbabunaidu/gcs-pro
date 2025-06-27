import { useState, useEffect, useRef } from 'react';
import { MapView } from './components/MapView';
import { VideoView } from './components/VideoView';
import { LogToast } from './components/LogToast';
import './styles.css';

interface Log {
  id: number;
  message: string;
  level: 'INFO' | 'WARN' | 'CRITICAL';
  timestamp: string;
}

interface Telemetry {
  altitude: number;
  speed: number;
  battery: number;
  heading: number;
  status: string;
  gps_fix: boolean;
  errors_count: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

function App() {
  const [viewMode, setViewMode] = useState<'MAP' | 'VIDEO'>('MAP');
  const [dronePosition, setDronePosition] = useState<[number, number]>([47.6062, -122.3321]);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    altitude: 120,
    speed: 0,
    battery: 95,
    heading: 0,
    status: 'STANDBY',
    gps_fix: true,
    errors_count: 0,
    vx: 0,
    vy: 0,
    vz: 0,
  });
  const [logs, setLogs] = useState<Log[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventListenerSetup = useRef(false);

  // Event listener setup
  useEffect(() => {
    if (eventListenerSetup.current) return;
    
    eventListenerSetup.current = true;
    let cleanup: (() => void) | null = null;

    const setupEventListener = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).__TAURI__?.event) {
          const { listen } = await import('@tauri-apps/api/event');
          
          const unlisten = await listen('new-backend-event', (event: any) => {
            try {
              const backendEvent = JSON.parse(event.payload);
              const { source, data } = backendEvent;
              
              // Handle payload events - create meaningful toast messages
              if (source !== 'DRONE') {
                const eventData = JSON.parse(backendEvent.data?.command || '{}');
                const eventName = eventData.event || backendEvent.event || 'Unknown Event';
                const subsystem = eventData.subsystem || 'SYSTEM';
                const details = eventData.details || '';
                const level: 'INFO' | 'WARN' | 'CRITICAL' = eventData.level || 'INFO';
                const data = eventData.data || {};
                
                // Create dynamic message from the actual event data
                let message = details || eventName.replace(/_/g, ' ').toLowerCase()
                  .split(' ')
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                // Add relevant data points if available
                const dataPoints = [];
                if (data.scan_area) dataPoints.push(`Area: ${data.scan_area}`);
                if (data.resolution) dataPoints.push(`Resolution: ${data.resolution}`);
                if (data.file_size) dataPoints.push(`Size: ${data.file_size}`);
                if (data.location) dataPoints.push(`Location: ${data.location}`);
                if (data.max_temp) dataPoints.push(`Max temp: ${data.max_temp}°C`);
                if (data.min_temp) dataPoints.push(`Min temp: ${data.min_temp}°C`);
                if (data.anomalies) dataPoints.push(`Anomalies: ${data.anomalies}`);
                if (data.bandwidth) dataPoints.push(`Bandwidth: ${data.bandwidth}`);
                if (data.latency) dataPoints.push(`Latency: ${data.latency}`);
                if (data.waypoint) dataPoints.push(`Waypoint: ${data.waypoint}`);
                if (data.eta_next) dataPoints.push(`ETA: ${data.eta_next}`);
                if (data.coverage) dataPoints.push(`Coverage: ${data.coverage}`);
                if (data.images) dataPoints.push(`Images: ${data.images}`);
                if (data.distance) dataPoints.push(`Distance: ${data.distance}`);
                if (data.boundary) dataPoints.push(`Boundary: ${data.boundary}`);
                if (data.available) dataPoints.push(`Available: ${data.available}`);
                if (data.used) dataPoints.push(`Used: ${data.used}`);
                if (data.level) dataPoints.push(`Level: ${data.level}G`);
                if (data.threshold) dataPoints.push(`Threshold: ${data.threshold}G`);
                if (data.temp) dataPoints.push(`Temp: ${data.temp}`);
                if (data.limit) dataPoints.push(`Limit: ${data.limit}`);
                if (data.satellites) dataPoints.push(`Satellites: ${data.satellites}`);
                if (data.strength) dataPoints.push(`Strength: ${data.strength}`);
                if (data.backup_status) dataPoints.push(`Backup: ${data.backup_status}`);
                if (data.data_loss) dataPoints.push(`Data loss: ${data.data_loss}`);
                if (data.voltage) dataPoints.push(`Voltage: ${data.voltage}`);
                if (data.expected) dataPoints.push(`Expected: ${data.expected}`);
                if (data.reason) dataPoints.push(`Reason: ${data.reason}`);
                if (data.eta) dataPoints.push(`ETA: ${data.eta}`);
                
                // Append data points to message if any exist
                if (dataPoints.length > 0) {
                  message += ` (${dataPoints.slice(0, 2).join(', ')})`;
                }
                
                // Add subsystem prefix for context
                const finalMessage = `${subsystem}: ${message}`;
                
                const newLog: Log = {
                  id: Date.now() + Math.random(),
                  message: finalMessage,
                  level,
                  timestamp: new Date().toLocaleTimeString()
                };
                
                console.log('📨 Payload Event:', {
                  event: eventName,
                  subsystem,
                  level,
                  details,
                  data,
                  finalMessage
                });
                
                setLogs(prev => {
                  const newLogs = [...prev.slice(-4), newLog];
                  
                  // Auto-remove after 8 seconds
                  setTimeout(() => {
                    setLogs(currentLogs => currentLogs.filter(l => l.id !== newLog.id));
                  }, 8000);
                  
                  return newLogs;
                });
              }
              
              // Update connection status
              setIsConnected(true);
              
              // Handle drone telemetry updates
              if (source === 'DRONE' && data) {
                setTelemetry(prev => ({
                  altitude: data.alt !== undefined ? data.alt : prev.altitude,
                  speed: data.vx !== undefined && data.vy !== undefined ? Math.sqrt((data.vx/100) ** 2 + (data.vy/100) ** 2) : prev.speed,
                  battery: data.battery_remaining !== undefined ? data.battery_remaining : prev.battery,
                  heading: data.heading !== undefined ? data.heading : prev.heading,
                  status: data.system_status ? data.system_status.toUpperCase() : prev.status,
                  gps_fix: data.gps_fix !== undefined ? data.gps_fix : prev.gps_fix,
                  errors_count: data.errors_count !== undefined ? data.errors_count : prev.errors_count,
                  vx: data.vx !== undefined ? data.vx : prev.vx,
                  vy: data.vy !== undefined ? data.vy : prev.vy,
                  vz: data.vz !== undefined ? data.vz : prev.vz,
                }));
                
                if (data.lat && data.lon) {
                  setDronePosition([data.lat, data.lon]);
                }
              }
              
            } catch (error) {
              console.error('Error parsing event:', error);
            }
          });
          
          cleanup = unlisten;
        } else {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Failed to setup event listener:', error);
        setIsConnected(true);
      }
    };

    setupEventListener();

    return () => {
      if (cleanup) {
        cleanup();
      }
      eventListenerSetup.current = false;
    };
  }, []);

  const handleViewToggle = () => {
    setViewMode(currentMode => (currentMode === 'MAP' ? 'VIDEO' : 'MAP'));
  };

  const dismissLog = (logId: number) => {
    setLogs(currentLogs => currentLogs.filter(log => log.id !== logId));
  };

  return (
    <div className="app-container">
      {/* Connection Status Indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-dot"></div>
        <span>{isConnected ? 'Mission Control Active' : 'Awaiting Connection'}</span>
      </div>

      {/* Main View */}
      {viewMode === 'MAP' ? (
        <MapView 
          position={dronePosition} 
          telemetry={telemetry} 
          onVideoToggle={handleViewToggle}
        />
      ) : (
        <VideoView 
          telemetry={telemetry}
          onMapToggle={handleViewToggle} 
        />
      )}

      {/* Log Toast Container */}
      <div className="log-toast-container">
        {logs.map(log => (
          <LogToast 
            key={log.id} 
            log={log}
            onDismiss={() => dismissLog(log.id)}
          />
        ))}
      </div>

      {/* Debug Info */}
      <div className="debug-info" style={{ 
        fontSize: '11px', 
        backgroundColor: 'rgba(0,0,0,0.9)',
        border: '1px solid #00ff00',
        color: '#00ff00'
      }}>
        <p><strong>🔍 DEBUG INFO:</strong></p>
        <p>📍 Position: {dronePosition[0].toFixed(6)}, {dronePosition[1].toFixed(6)}</p>
        <p>📏 Altitude: {telemetry.altitude}m | 🔋 Battery: {telemetry.battery}%</p>
        <p>🧭 Heading: {telemetry.heading}° | 📊 Status: {telemetry.status}</p>
        <p>📝 Active Logs: {logs.length} | 🔗 Connected: {isConnected ? 'YES' : 'NO'}</p>
        <p>🌐 Mode: {viewMode} | 🎯 Environment: {typeof window !== 'undefined' && (window as any).__TAURI__ ? 'Tauri' : 'Browser'}</p>
        <p><strong>⚡ Last Update: {new Date().toLocaleTimeString()}</strong></p>
      </div>
    </div>
  );
}

export default App;
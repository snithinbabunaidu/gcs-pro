import { useState, useEffect } from 'react';
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

  // Auto-remove logs after 8 seconds
  useEffect(() => {
    if (logs.length > 0) {
      const timer = setTimeout(() => {
        setLogs(currentLogs => currentLogs.slice(1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [logs]);

  // SIMPLIFIED EVENT LISTENER
  useEffect(() => {
    console.log('🔍 Setting up event listener...');
    
    let cleanup: (() => void) | null = null;

    const setupEventListener = async () => {
      try {
        // Check if we're in Tauri
        if (typeof window !== 'undefined' && (window as any).__TAURI__?.event) {
          console.log('✅ Tauri detected!');
          
          // Import the listen function
          const { listen } = await import('@tauri-apps/api/event');
          
          console.log('🎧 Setting up listener for "new-backend-event"...');
          
          // Listen for events
          const unlisten = await listen('new-backend-event', (event: any) => {
            console.log('🎉 EVENT RECEIVED!', event);
            console.log('📦 Event payload:', event.payload);
            console.log('📦 Payload type:', typeof event.payload);
            
            try {
              // Parse the JSON payload
              const backendEvent = JSON.parse(event.payload);
              console.log('📋 Parsed event:', backendEvent);
              
              const { source, message, data, timestamp } = backendEvent;
              
              // Add log toast
              const newLog: Log = {
                id: Date.now() + Math.random(),
                message: `${source}: ${message}`,
                level: message.includes('EMERGENCY') ? 'CRITICAL' : 'INFO',
                timestamp
              };
              
              console.log('📝 Adding log:', newLog);
              setLogs(prev => [...prev.slice(-4), newLog]);
              
              // Update connection status
              setIsConnected(true);
              
              // Handle DRONE events
              if (source === 'DRONE' && data) {
                console.log('🚁 Processing drone data:', data);
                
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
                  console.log(`📍 NEW POSITION: ${data.lat}, ${data.lon}`);
                  setDronePosition([data.lat, data.lon]);
                }
              }
              
            } catch (error) {
              console.error('❌ Error parsing event:', error);
              console.error('❌ Raw payload:', event.payload);
            }
          });
          
          cleanup = unlisten;
          console.log('✅ Event listener setup complete!');
          
        } else {
          console.log('❌ Not in Tauri environment');
          // Simulate for browser testing
          setIsConnected(true);
        }
        
      } catch (error) {
        console.error('❌ Failed to setup event listener:', error);
        setIsConnected(true); // Fallback
      }
    };

    setupEventListener();

    return () => {
      if (cleanup) {
        cleanup();
        console.log('🧹 Cleaned up event listener');
      }
    };
  }, []);

  const handleViewToggle = () => {
    setViewMode(currentMode => (currentMode === 'MAP' ? 'VIDEO' : 'MAP'));
  };

  const dismissLog = (logId: number) => {
    setLogs(currentLogs => currentLogs.filter(log => log.id !== logId));
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('📍 Drone position updated:', dronePosition);
  }, [dronePosition]);

  useEffect(() => {
    console.log('📊 Telemetry updated:', telemetry);
  }, [telemetry]);

  useEffect(() => {
    console.log('📝 Logs updated:', logs.length, 'total logs');
  }, [logs]);

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

      {/* Enhanced Debug Info */}
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
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
}

function App() {
  const [viewMode, setViewMode] = useState<'MAP' | 'VIDEO'>('MAP');
  const [dronePosition, setDronePosition] = useState<[number, number]>([47.6062, -122.3321]);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    altitude: 120,
    speed: 0,
    battery: 95,
    heading: 0,
    status: 'STANDBY'
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
                
                if (data.lat && data.lon) {
                  console.log(`📍 NEW POSITION: ${data.lat}, ${data.lon}`);
                  setDronePosition([data.lat, data.lon]);
                }
                
                if (data.alt !== undefined) {
                  console.log(`📏 NEW ALTITUDE: ${data.alt}`);
                  setTelemetry(prev => ({ ...prev, altitude: data.alt }));
                }
                
                if (data.battery_remaining !== undefined) {
                  console.log(`🔋 NEW BATTERY: ${data.battery_remaining}%`);
                  setTelemetry(prev => ({ ...prev, battery: data.battery_remaining }));
                }
                
                if (data.heading !== undefined) {
                  console.log(`🧭 NEW HEADING: ${data.heading}°`);
                  setTelemetry(prev => ({ ...prev, heading: data.heading }));
                }
                
                if (data.system_status) {
                  console.log(`📊 NEW STATUS: ${data.system_status}`);
                  setTelemetry(prev => ({ ...prev, status: data.system_status.toUpperCase() }));
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
# Mission Control Hub

A sophisticated real-time drone mission control interface built with Tauri, React, and TypeScript. This application provides comprehensive monitoring, telemetry visualization, and payload event management for drone operations.

![image](https://github.com/user-attachments/assets/cc3d50ca-cdb4-4282-8027-5cb71d132c26)

![image](https://github.com/user-attachments/assets/a8a0bb72-bebe-4a1c-98e8-30386a32f5df)

## Features

### Core Functionality
- **Real-time Telemetry Display** - Live altitude, speed, battery, heading, and GPS status
- **Interactive Map View** - OpenStreetMap integration with satellite overlay and drone tracking
- **Live Video Feed** - Picture-in-picture video streaming with camera controls
- **Smart Notifications** - Contextual toast notifications for payload and system events
- **Dual View Modes** - Switch between map-focused and video-focused interfaces
- **Connection Status** - Real-time connection monitoring with visual indicators

### Technical Features
- **Event-Driven Architecture** - Tauri's event system for seamless frontend-backend communication
- **Hot Module Replacement** - Development-friendly with proper HMR handling
- **Responsive Design** - Optimized for various screen sizes and orientations
- **Performance Optimized** - Efficient state management and event handling

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   MapView   │  │  VideoView  │  │   LogToast System   │  │
│  │             │  │             │  │                     │  │
│  │ • Leaflet   │  │ • Camera    │  │ • Smart Filtering   │  │
│  │ • Drone     │  │   Controls  │  │ • Auto-dismiss      │  │
│  │   Tracking  │  │ • PiP Mode  │  │ • Level-based UI    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Tauri Event Bridge                     │
├─────────────────────────────────────────────────────────────┤
│                    Backend Services                        │
│  ┌─────────────────┐              ┌─────────────────────┐  │
│  │ MAVLink         │              │ Payload             │  │
│  │ Simulator       │              │ Simulator           │  │
│  │                 │              │                     │  │
│  │ • HEARTBEAT     │              │ • System Events     │  │
│  │ • POSITION      │              │ • Sensor Data       │  │
│  │ • ATTITUDE      │              │ • Mission Updates   │  │
│  │ • SYS_STATUS    │              │ • Alerts & Alarms   │  │
│  └─────────────────┘              └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
mission-control-hub/
├── src/
│   ├── components/
│   │   ├── MapView.tsx           # Interactive map with drone tracking
│   │   ├── MapView.module.css    # Map component styles
│   │   ├── VideoView.tsx         # Video feed and camera controls
│   │   ├── VideoView.module.css  # Video component styles
│   │   ├── TelemetryOverlay.tsx  # HUD-style telemetry display
│   │   ├── TelemetryOverlay.module.css
│   │   ├── LogToast.tsx          # Smart notification system
│   │   └── LogToast.module.css   # Toast notification styles
│   ├── simulators/
│   │   ├── mavlink-simulator.js  # MAVLink protocol simulator
│   │   └── payload-simulator.js  # Payload event simulator
│   ├── App.tsx                   # Main application component
│   ├── App.css                   # Global application styles
│   ├── styles.css                # Additional styling
│   └── main.tsx                  # Application entry point
├── src-tauri/                    # Tauri backend configuration
├── public/                       # Static assets
└── package.json                  # Dependencies and scripts
```

## Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **Rust** (latest stable)
- **npm** or **pnpm**

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mission-control-hub.git
   cd mission-control-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Install Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli
   # or
   cargo install tauri-cli
   ```

4. **Start development environment**
   ```bash
   npm run tauri dev
   # or
   pnpm tauri dev
   ```

## Usage

### Starting the Application

1. **Launch the main application**
   ```bash
   npm run tauri dev
   ```

2. **Start the MAVLink simulator** (in a separate terminal)
   ```bash
   node src/simulators/mavlink-simulator.js
   ```

3. **Start the payload simulator** (in another terminal)
   ```bash
   node src/simulators/payload-simulator.js
   ```

### Interface Navigation

#### Map View
- **Drone Tracking**: Real-time position updates with custom drone icon
- **Telemetry HUD**: Comprehensive flight data overlay
- **Video PiP**: Picture-in-picture video feed in bottom-right corner
- **Map Controls**: Zoom, center on drone, and layer toggles
- **Interactive Popup**: Click drone icon for detailed telemetry

#### Video View  
- **Full-Screen Video**: Primary video feed with overlay controls
- **Camera Controls**: Zoom, gimbal control, and capture functions
- **Map PiP**: Picture-in-picture map view in top-right corner
- **Recording Indicator**: Live recording status display

### Event System

#### MAVLink Events (Telemetry Updates)
- `HEARTBEAT` - System status and mode
- `GLOBAL_POSITION_INT` - GPS coordinates and altitude
- `ATTITUDE` - Roll, pitch, yaw orientation
- `SYS_STATUS` - Battery and system health

#### Payload Events (Toast Notifications)
- **INFO Level**: Routine operations (camera init, scans, calibrations)
- **WARN Level**: Attention required (low storage, high temperature)
- **CRITICAL Level**: Immediate action needed (system failures, emergency protocols)

## Configuration

### Event Frequency
Modify simulator frequencies in the respective files:

**MAVLink Simulator (`mavlink-simulator.js`)**
```javascript
// HEARTBEAT every 1s
setInterval(() => { /* ... */ }, 1000);

// GLOBAL_POSITION_INT every 200ms (5Hz)  
setInterval(() => { /* ... */ }, 200);

// ATTITUDE every 100ms (10Hz)
setInterval(() => { /* ... */ }, 100);

// SYS_STATUS every 2s (0.5Hz)
setInterval(() => { /* ... */ }, 2000);
```

**Payload Simulator (`payload-simulator.js`)**
```javascript
// Events every 3-8 seconds
const delay = Math.random() * 5000 + 3000;
```

### Toast Auto-Dismiss
Adjust notification duration in `App.tsx`:
```typescript
setTimeout(() => {
  setLogs(currentLogs => currentLogs.filter(l => l.id !== newLog.id));
}, 8000); // 8 seconds
```

### Map Configuration
Customize map settings in `MapView.tsx`:
```typescript
<MapContainer
  center={position}
  zoom={16}        // Default zoom level
  className={styles.map}
  zoomControl={false}
>
```

## Styling & Theming

### Color Scheme
The application uses a dark theme optimized for mission control environments:

- **Primary**: Dark backgrounds with high contrast text
- **Accent Colors**: 
  - Info: `#2196F3` (Blue)
  - Warning: `#FF9800` (Orange)  
  - Critical: `#F44336` (Red)
  - Success: `#4CAF50` (Green)

### CSS Modules
Each component uses CSS modules for scoped styling:
- `MapView.module.css` - Map interface styles
- `VideoView.module.css` - Video interface styles
- `LogToast.module.css` - Notification styles
- `TelemetryOverlay.module.css` - HUD styles

## 🧪 Development

### Development Mode Features
- **Hot Module Replacement** - React components update without full reload
- **Event Listener Protection** - Prevents duplicate listeners during HMR
- **Debug Information** - Real-time debug panel in bottom-left corner
- **Console Logging** - Detailed event logging for development

### Building for Production
```bash
npm run tauri build
# or
pnpm tauri build
```

### Debugging
1. **Frontend Issues**: Use browser dev tools
2. **Backend Issues**: Check Tauri console output
3. **Event Issues**: Monitor console logs for event flow
4. **Performance**: Use React DevTools profiler

## Event Protocol

### MAVLink Event Structure
```json
{
  "timestamp": "08:17:36",
  "source": "DRONE", 
  "message": "Position update: GLOBAL_POSITION_INT",
  "data": {
    "alt": 81,
    "heading": 208.0,
    "lat": 47.610535,
    "lon": -122.337205,
    "vx": 150,
    "vy": -200,
    "vz": 50
  }
}
```

### Payload Event Structure
```json
{
  "timestamp": "08:17:37",
  "source": "PAYLOAD",
  "message": "Command: {...}",
  "data": {
    "command": "{\"event\":\"LIDAR_SCAN_STARTED\",\"level\":\"INFO\",\"subsystem\":\"LIDAR\",\"details\":\"LIDAR terrain mapping initiated.\",\"data\":{\"scan_area\":\"500x500m\",\"resolution\":\"10cm\"}}"
  }
}
```

## Troubleshooting

### Common Issues

#### No Events Received
- Ensure simulators are running
- Check Tauri event listener setup
- Verify network connections

#### Duplicate Notifications  
- Remove `React.StrictMode` from `main.tsx`
- Check for multiple event listener setups

#### Map Not Loading
- Verify internet connection for tile loading
- Check console for tile loading errors
- Ensure proper API keys if using custom tile servers

#### Video Feed Issues
- Check video file path in `public/` directory
- Verify video format compatibility (MP4 recommended)
- Ensure proper CORS headers for external video sources

### Performance Optimization
- **Event Throttling**: Limit high-frequency events if needed
- **State Batching**: Use React's automatic batching for updates
- **Memory Management**: Logs auto-remove to prevent memory leaks
- **Rendering Optimization**: CSS modules and proper React keys

## Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for type safety
- Follow React best practices
- Maintain CSS module organization
- Add appropriate error handling
- Include console logging for debugging

## Acknowledgments

- **Tauri Team** - For the excellent desktop app framework
- **Leaflet** - For the interactive mapping capabilities  
- **React Team** - For the robust frontend framework
- **OpenStreetMap** - For the map tile services

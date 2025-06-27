const net = require('net');
const PORT = 9001;
const HOST = '127.0.0.1';


// More realistic payload events with proper categorization
const payloadEvents = [
    // Camera/Imaging Events
    { event: 'CAMERA_INIT', level: 'INFO', subsystem: 'CAMERA', details: 'Camera system initialized successfully.', data: { resolution: '4K', fps: 30 } },
    { event: 'IMAGE_CAPTURED', level: 'INFO', subsystem: 'CAMERA', details: 'High-resolution image captured.', data: { file_size: '12.4MB', location: 'grid_A4' } },
    { event: 'THERMAL_SCAN_COMPLETE', level: 'INFO', subsystem: 'THERMAL', details: 'Thermal imaging scan completed.', data: { max_temp: 45.2, min_temp: 12.8, anomalies: 2 } },
    { event: 'CAMERA_GIMBAL_CALIBRATED', level: 'INFO', subsystem: 'GIMBAL', details: 'Camera gimbal calibration complete.', data: { pitch_range: '±90°', yaw_range: '±180°' } },
    
    // Sensor Events
    { event: 'LIDAR_SCAN_STARTED', level: 'INFO', subsystem: 'LIDAR', details: 'LIDAR terrain mapping initiated.', data: { scan_area: '500x500m', resolution: '10cm' } },
    { event: 'MAGNETOMETER_CALIBRATION', level: 'INFO', subsystem: 'SENSOR', details: 'Magnetometer calibration successful.', data: { accuracy: '99.2%', deviation: '0.8°' } },
    { event: 'BAROMETER_READING', level: 'INFO', subsystem: 'SENSOR', details: 'Atmospheric pressure reading.', data: { pressure: '1013.25 hPa', altitude: '120.5m' } },
    
    // Communication Events
    { event: 'DATALINK_ESTABLISHED', level: 'INFO', subsystem: 'COMM', details: 'High-bandwidth data link established.', data: { bandwidth: '50 Mbps', latency: '12ms' } },
    { event: 'TELEMETRY_BURST', level: 'INFO', subsystem: 'COMM', details: 'Telemetry data burst transmitted.', data: { packets: 1247, size: '2.1MB' } },
    
    // Mission Events
    { event: 'WAYPOINT_REACHED', level: 'INFO', subsystem: 'NAV', details: 'Navigation waypoint reached.', data: { waypoint: 'WP_07', eta_next: '2.3 min' } },
    { event: 'MISSION_PHASE_COMPLETE', level: 'INFO', subsystem: 'MISSION', details: 'Survey phase Alpha completed.', data: { coverage: '87%', images: 156 } },
    { event: 'GEOFENCE_APPROACH', level: 'WARN', subsystem: 'NAV', details: 'Approaching geofence boundary.', data: { distance: '50m', boundary: 'NORTH_SECTOR' } },
    
    // Warning Events
    { event: 'LOW_STORAGE_WARNING', level: 'WARN', subsystem: 'STORAGE', details: 'Storage space below 20%.', data: { available: '18%', used: '164GB' } },
    { event: 'HIGH_VIBRATION_DETECTED', level: 'WARN', subsystem: 'SENSOR', details: 'Unusual vibration levels detected.', data: { level: '8.2G', threshold: '6.0G' } },
    { event: 'TEMPERATURE_WARNING', level: 'WARN', subsystem: 'THERMAL', details: 'Payload temperature elevated.', data: { temp: '67°C', limit: '70°C' } },
    { event: 'WEAK_GPS_SIGNAL', level: 'WARN', subsystem: 'GPS', details: 'GPS signal strength degraded.', data: { satellites: 6, strength: '42%' } },
    
    // Critical Events (rare)
    { event: 'STORAGE_FAILURE', level: 'CRITICAL', subsystem: 'STORAGE', details: 'Primary storage device failure.', data: { backup_status: 'ACTIVE', data_loss: 'NONE' } },
    { event: 'PAYLOAD_POWER_FAULT', level: 'CRITICAL', subsystem: 'POWER', details: 'Power supply fault detected.', data: { voltage: '11.2V', expected: '12.0V' } },
    { event: 'EMERGENCY_LANDING_TRIGGER', level: 'CRITICAL', subsystem: 'SAFETY', details: 'Emergency landing protocol activated.', data: { reason: 'PAYLOAD_FAULT', eta: '90 seconds' } }
];

// Weighted event selection for more realistic distribution
const eventWeights = {
    'INFO': 0.70,      // 70% of events are informational
    'WARN': 0.25,      // 25% are warnings
    'CRITICAL': 0.05   // 5% are critical
};

function getRandomEvent() {
    const rand = Math.random();
    let level;
    
    if (rand < eventWeights.CRITICAL) {
        level = 'CRITICAL';
    } else if (rand < eventWeights.CRITICAL + eventWeights.WARN) {
        level = 'WARN';
    } else {
        level = 'INFO';
    }
    
    const eventsOfLevel = payloadEvents.filter(e => e.level === level);
    return eventsOfLevel[Math.floor(Math.random() * eventsOfLevel.length)];
}

function randomId() {
    return Math.floor(Math.random() * 1e8).toString(16).toUpperCase();
}

// Enhanced payload data with realistic sensor readings
function generateRealisticPayloadData() {
    return {
        cpu_usage: Math.round(Math.random() * 40 + 20), // 20-60%
        memory_usage: Math.round(Math.random() * 30 + 40), // 40-70%
        storage_used: Math.round(Math.random() * 20 + 65), // 65-85%
        temperature: Math.round((Math.random() * 20 + 35) * 10) / 10, // 35-55°C
        uptime: Math.floor(Math.random() * 14400 + 1800), // 30min - 4hrs in seconds
        active_sensors: Math.floor(Math.random() * 3 + 5), // 5-8 sensors
        data_rate: Math.round((Math.random() * 15 + 5) * 10) / 10 // 5-20 Mbps
    };
}

function sendPayloadEvent() {
    const client = new net.Socket();
    const selectedEvent = getRandomEvent();
    
    const payload = {
        ...selectedEvent,
        event_id: randomId(),
        timestamp: new Date().toISOString(),
        source: 'PAYLOAD_CONTROLLER',
        system_data: generateRealisticPayloadData()
    };
    
    client.connect(PORT, HOST, () => {
        client.write(JSON.stringify(payload));
        console.log(`📤 [${payload.level}] ${payload.event}`);
        client.destroy();
    });
    
    client.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log('⚠️  Mission Control Hub not running (this is normal if the app isn\'t started yet)');
        } else {
            console.error('❌ TCP Client Error:', err.message);
        }
    });
}

function scheduleNextEvent() {
    // Increased frequency: 3-8 seconds instead of 8-20
    const delay = Math.random() * 5000 + 3000; // 3-8 seconds
    
    setTimeout(() => {
        sendPayloadEvent();
        scheduleNextEvent();
    }, delay);
}

// Startup sequence with realistic initialization events
function startupSequence() {
    const initEvents = [
        'CAMERA_INIT',
        'MAGNETOMETER_CALIBRATION', 
        'DATALINK_ESTABLISHED',
        'CAMERA_GIMBAL_CALIBRATED'
    ];
    
    console.log('🚀 Payload system initialization sequence...\n');
    
    initEvents.forEach((eventName, index) => {
        setTimeout(() => {
            const event = payloadEvents.find(e => e.event === eventName);
            if (event) {
                const payload = {
                    ...event,
                    event_id: randomId(),
                    timestamp: new Date().toISOString(),
                    source: 'PAYLOAD_CONTROLLER',
                    system_data: generateRealisticPayloadData()
                };
                
                const client = new net.Socket();
                client.connect(PORT, HOST, () => {
                    client.write(JSON.stringify(payload));
                    console.log(`🔧 INIT: ${payload.event} - ${payload.details}`);
                    client.destroy();
                });
                
                client.on('error', () => {}); // Suppress errors during init
            }
        }, (index + 1) * 2000); // 2 second intervals for init
    });
    
    // Start regular event sequence after initialization
    setTimeout(() => {
        console.log('\n✅ Payload initialization complete. Starting operational events...\n');
        scheduleNextEvent();
    }, initEvents.length * 2000 + 3000);
}

// Start the initialization sequence
setTimeout(startupSequence, 3000);

process.on('SIGINT', () => {
    console.log('\n🛑 Enhanced Payload Simulator shutting down...');
    process.exit(0);
});
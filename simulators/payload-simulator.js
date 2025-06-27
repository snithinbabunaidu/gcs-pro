const net = require('net');
const PORT = 9001;
const HOST = '127.0.0.1';

console.log('🔧 Payload Simulator Started!');
console.log(`📡 Connecting to Mission Control Hub at ${HOST}:${PORT}`);
console.log('🎯 Simulating sci-fi payload events...\n');

const payloadEvents = [
    { event: 'LASER_SCAN_STARTED', level: 'INFO', subsystem: 'LIDAR', details: 'High-res scan initiated.' },
    { event: 'SHIELD_ACTIVATED', level: 'INFO', subsystem: 'SHIELD', details: 'Defensive shield online.' },
    { event: 'AI_TARGET_LOCK', level: 'INFO', subsystem: 'AI', details: 'Target locked by onboard AI.' },
    { event: 'CAMERA_OVERHEAT', level: 'WARN', subsystem: 'CAMERA', details: 'Camera temperature high.' },
    { event: 'PAYLOAD_JAMMED', level: 'CRITICAL', subsystem: 'PAYLOAD', details: 'Payload mechanism jammed.' },
    { event: 'MAPPING_STARTED', level: 'INFO', subsystem: 'MAPPER', details: 'Area mapping in progress.' },
    { event: 'MAPPING_STOPPED', level: 'INFO', subsystem: 'MAPPER', details: 'Mapping complete.' },
    { event: 'EMERGENCY_SHUTDOWN', level: 'CRITICAL', subsystem: 'CORE', details: 'Emergency shutdown triggered.' },
    { event: 'THERMAL_ALERT', level: 'WARN', subsystem: 'THERMAL', details: 'Thermal anomaly detected.' },
    { event: 'PAYLOAD_RECOVERY', level: 'INFO', subsystem: 'PAYLOAD', details: 'Payload system recovered.' },
    { event: 'STEALTH_MODE_ENGAGED', level: 'INFO', subsystem: 'STEALTH', details: 'Stealth mode active.' },
    { event: 'SENSOR_CALIBRATION', level: 'INFO', subsystem: 'SENSOR', details: 'Calibration routine complete.' },
    { event: 'POWER_SURGE', level: 'WARN', subsystem: 'POWER', details: 'Power surge detected.' },
    { event: 'AI_DIAGNOSTICS', level: 'INFO', subsystem: 'AI', details: 'Diagnostics check passed.' },
    { event: 'SHIELD_FAILURE', level: 'CRITICAL', subsystem: 'SHIELD', details: 'Shield system failure.' }
];

function randomId() {
    return Math.floor(Math.random() * 1e8).toString(16).toUpperCase();
}

let eventIndex = 0;

function sendPayloadEvent() {
    const client = new net.Socket();
    const base = payloadEvents[eventIndex % payloadEvents.length];
    eventIndex++;
    const payload = {
        ...base,
        event_id: randomId(),
        timestamp: new Date().toISOString(),
        source: 'PAYLOAD_CONTROLLER',
    };
    client.connect(PORT, HOST, () => {
        client.write(JSON.stringify(payload));
        console.log(`📤 Sent event: ${payload.event} (${payload.level})`);
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
    const delay = Math.random() * 5000 + 5000; // 5-10 seconds
    setTimeout(() => {
        sendPayloadEvent();
        scheduleNextEvent();
    }, delay);
}

setTimeout(() => {
    console.log('🚀 Starting sci-fi payload event sequence...\n');
    sendPayloadEvent();
    scheduleNextEvent();
}, 3000);

process.on('SIGINT', () => {
    console.log('\n🛑 Payload Simulator shutting down...');
    process.exit(0);
});
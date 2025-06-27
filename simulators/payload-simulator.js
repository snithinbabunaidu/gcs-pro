const net = require('net');
const PORT = 9001;
const HOST = '127.0.0.1';

console.log('🔧 Payload Simulator Started!');
console.log(`📡 Connecting to Mission Control Hub at ${HOST}:${PORT}`);
console.log('🎯 Simulating various payload commands...\n');

// Array of realistic payload commands
const payloadCommands = [
    'ACTIVATE_LIDAR_SCAN',
    'START_THERMAL_IMAGING',
    'CAPTURE_HIGH_RES_PHOTO',
    'BEGIN_VIDEO_RECORDING',
    'STOP_VIDEO_RECORDING',
    'ZOOM_IN_2X',
    'ZOOM_OUT_1X',
    'SWITCH_TO_INFRARED',
    'SWITCH_TO_VISIBLE_LIGHT',
    'STABILIZE_GIMBAL',
    'POINT_GIMBAL_DOWN',
    'POINT_GIMBAL_FORWARD',
    'START_AREA_MAPPING',
    'STOP_AREA_MAPPING',
    'EMERGENCY_PAYLOAD_SHUTDOWN',
    'RUN_DIAGNOSTICS',
    'CALIBRATE_SENSORS',
    'SAVE_WAYPOINT',
    'START_FOLLOW_MODE',
    'STOP_FOLLOW_MODE'
];

let commandIndex = 0;

// Send payload commands every 8-12 seconds (randomized)
function scheduleNextCommand() {
    const delay = Math.random() * 4000 + 8000; // 8-12 seconds
    
    setTimeout(() => {
        sendPayloadCommand();
        scheduleNextCommand();
    }, delay);
}

function sendPayloadCommand() {
    const client = new net.Socket();
    const command = payloadCommands[commandIndex % payloadCommands.length];
    commandIndex++;
    
    client.connect(PORT, HOST, () => {
        console.log(`🔗 Connected to Mission Control Hub`);
        client.write(command);
        console.log(`📤 Sent command: ${command}`);
        
        // Add some metadata in a second message
        setTimeout(() => {
            const metadata = JSON.stringify({
                command_id: commandIndex,
                timestamp: new Date().toISOString(),
                priority: Math.random() > 0.8 ? 'HIGH' : 'NORMAL',
                source: 'PAYLOAD_CONTROLLER'
            });
            client.write(`\nMETADATA: ${metadata}`);
            client.destroy(); // Close connection
        }, 100);
    });

    client.on('data', (data) => {
        console.log('📥 Response from hub:', data.toString());
    });

    client.on('close', () => {
        console.log('🔌 Connection closed\n');
    });

    client.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log('⚠️  Mission Control Hub not running (this is normal if the app isn\'t started yet)');
        } else {
            console.error('❌ TCP Client Error:', err.message);
        }
    });
}

// Send first command after 3 seconds to allow main app to start
setTimeout(() => {
    console.log('🚀 Starting payload command sequence...\n');
    sendPayloadCommand();
    scheduleNextCommand();
}, 3000);

// Send a status ping every 30 seconds
setInterval(() => {
    const client = new net.Socket();
    client.connect(PORT, HOST, () => {
        client.write('PAYLOAD_STATUS_PING');
        console.log('📡 Status ping sent');
        client.destroy();
    });
    
    client.on('error', (err) => {
        if (err.code !== 'ECONNREFUSED') {
            console.error('❌ Status ping error:', err.message);
        }
    });
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Payload Simulator shutting down...');
    process.exit(0);
});
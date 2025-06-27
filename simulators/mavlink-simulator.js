const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const PORT = 14550;
const HOST = '127.0.0.1';

// Starting position (Seattle area)
let lat = 47.6062;
let lon = -122.3321;
let alt = 120;

console.log('🚁 MAVLink Simulator Started!');
console.log(`📡 Sending telemetry data to UDP ${HOST}:${PORT}`);
console.log('📍 Simulating drone movement around Seattle...\n');

// Send heartbeat every 5 seconds
setInterval(() => {
    const heartbeatPacket = {
        packet_type: "HEARTBEAT",
        system_status: "standby",
        mavlink_version: 2
    };

    const message = Buffer.from(JSON.stringify(heartbeatPacket));
    client.send(message, 0, message.length, PORT, HOST, (err) => {
        if (err) {
            console.error('❌ Error sending HEARTBEAT:', err.message);
        } else {
            console.log('💓 HEARTBEAT sent');
        }
    });
}, 5000);

// Send position updates every 2 seconds
setInterval(() => {
    // Simulate realistic movement (small increments)
    lat += (Math.random() - 0.5) * 0.0002; // ~22 meters max change
    lon += (Math.random() - 0.5) * 0.0002;
    alt += Math.floor((Math.random() - 0.5) * 10); // ±5 meter altitude change
    
    // Keep altitude reasonable
    alt = Math.max(80, Math.min(200, alt));

    const telemetryPacket = {
        packet_type: "GLOBAL_POSITION_INT",
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6)),
        alt: alt,
        relative_alt: alt - 50, // Assuming ground level is 50m
        heading: Math.floor(Math.random() * 360)
    };

    const message = Buffer.from(JSON.stringify(telemetryPacket));
    client.send(message, 0, message.length, PORT, HOST, (err) => {
        if (err) {
            console.error('❌ Error sending position:', err.message);
        } else {
            console.log(`📍 Position: ${lat.toFixed(6)}, ${lon.toFixed(6)}, ${alt}m`);
        }
    });
}, 2000);

// Send attitude updates every 1 second
setInterval(() => {
    const attitudePacket = {
        packet_type: "ATTITUDE",
        roll: (Math.random() - 0.5) * 0.2, // ±0.1 radians (~6 degrees)
        pitch: (Math.random() - 0.5) * 0.2,
        yaw: Math.random() * Math.PI * 2,
        rollspeed: (Math.random() - 0.5) * 0.1,
        pitchspeed: (Math.random() - 0.5) * 0.1,
        yawspeed: (Math.random() - 0.5) * 0.1
    };

    const message = Buffer.from(JSON.stringify(attitudePacket));
    client.send(message, 0, message.length, PORT, HOST, (err) => {
        if (!err) {
            console.log('🧭 Attitude data sent');
        }
    });
}, 1000);

// Battery status every 10 seconds
let batteryLevel = 95;
setInterval(() => {
    batteryLevel = Math.max(20, batteryLevel - Math.random() * 0.5); // Slow battery drain
    
    const batteryPacket = {
        packet_type: "SYS_STATUS",
        voltage_battery: Math.floor(batteryLevel * 0.42 * 100), // Convert to centivolts
        current_battery: Math.floor(Math.random() * 500 + 100), // 1-6A current draw
        battery_remaining: Math.floor(batteryLevel)
    };

    const message = Buffer.from(JSON.stringify(batteryPacket));
    client.send(message, 0, message.length, PORT, HOST, (err) => {
        if (!err) {
            console.log(`🔋 Battery: ${Math.floor(batteryLevel)}%`);
        }
    });
}, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 MAVLink Simulator shutting down...');
    client.close();
    process.exit(0);
});
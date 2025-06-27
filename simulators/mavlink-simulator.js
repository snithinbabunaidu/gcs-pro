const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const PORT = 14550;
const HOST = '127.0.0.1';

// Starting position (Seattle area)
let lat = 47.6062;
let lon = -122.3321;
let alt = 120;
let vx = 0;
let vy = 0;
let vz = 0;
let heading = 90;
let battery = 100;
let system_status = 'ACTIVE';
let gps_fix = true;
let errors_count = 0;

console.log('🚁 MAVLink Simulator Started!');
console.log(`📡 Sending telemetry data to UDP ${HOST}:${PORT}`);
console.log('📍 Simulating drone movement around Seattle...\n');

// Send HEARTBEAT every 1s
setInterval(() => {
    const heartbeatPacket = {
        packet_type: "HEARTBEAT",
        system_status,
        mode: "GUIDED",
        armed: true,
        mavlink_version: 2,
        level: "INFO"
    };
    const message = Buffer.from(JSON.stringify(heartbeatPacket));
    client.send(message, 0, message.length, PORT, HOST);
}, 1000);

// Send GLOBAL_POSITION_INT every 200ms (5Hz)
setInterval(() => {
    // Simulate movement
    vx = (Math.random() - 0.5) * 2; // m/s
    vy = (Math.random() - 0.5) * 2;
    vz = (Math.random() - 0.5) * 0.5;
    lat += vx * 0.00001;
    lon += vy * 0.00001;
    alt += vz;
    heading = (heading + Math.random() * 2 - 1) % 360;
    
    const positionPacket = {
        packet_type: "GLOBAL_POSITION_INT",
        lat: parseFloat(lat.toFixed(7)),
        lon: parseFloat(lon.toFixed(7)),
        alt: Math.round(alt),
        relative_alt: Math.round(alt - 50),
        vx: Math.round(vx * 100),
        vy: Math.round(vy * 100),
        vz: Math.round(vz * 100),
        heading: Math.round(heading),
        gps_fix,
        level: gps_fix ? "INFO" : "WARN"
    };
    const message = Buffer.from(JSON.stringify(positionPacket));
    client.send(message, 0, message.length, PORT, HOST);
}, 200);

// Send ATTITUDE every 100ms (10Hz)
setInterval(() => {
    const attitudePacket = {
        packet_type: "ATTITUDE",
        roll: (Math.random() - 0.5) * 0.2,
        pitch: (Math.random() - 0.5) * 0.2,
        yaw: heading * Math.PI / 180,
        rollspeed: (Math.random() - 0.5) * 0.1,
        pitchspeed: (Math.random() - 0.5) * 0.1,
        yawspeed: (Math.random() - 0.5) * 0.1,
        level: "INFO"
    };
    const message = Buffer.from(JSON.stringify(attitudePacket));
    client.send(message, 0, message.length, PORT, HOST);
}, 100);

// Send SYS_STATUS every 2s (0.5Hz)
setInterval(() => {
    battery -= Math.random() * 0.2;
    if (battery < 20) {
        system_status = 'CRITICAL';
        errors_count = 1;
    } else if (battery < 50) {
        system_status = 'WARN';
        errors_count = 0;
    } else {
        system_status = 'ACTIVE';
        errors_count = 0;
    }
    const sysStatusPacket = {
        packet_type: "SYS_STATUS",
        voltage_battery: Math.round(battery * 0.42 * 100),
        current_battery: Math.round(Math.random() * 500 + 100),
        battery_remaining: Math.round(battery),
        errors_count,
        level: battery < 20 ? "CRITICAL" : battery < 50 ? "WARN" : "INFO"
    };
    const message = Buffer.from(JSON.stringify(sysStatusPacket));
    client.send(message, 0, message.length, PORT, HOST);
}, 2000);

// Simulate GPS loss occasionally
setInterval(() => {
    if (Math.random() < 0.05) {
        gps_fix = false;
        setTimeout(() => { gps_fix = true; }, 3000);
    }
}, 5000);

process.on('SIGINT', () => {
    console.log('\n🛑 MAVLink Simulator shutting down...');
    client.close();
    process.exit(0);
});
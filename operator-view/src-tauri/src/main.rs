// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Manager, Emitter, State, Window};
use tokio::net::{TcpListener, UdpSocket};
use tokio::sync::Mutex;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct BackendEvent {
    timestamp: String,
    source: String,
    message: String,
    data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct MAVLinkPacket {
    packet_type: String,
    lat: Option<f64>,
    lon: Option<f64>,
    alt: Option<i32>,
    battery_remaining: Option<i32>,
    heading: Option<f64>,
    system_status: Option<String>,
}

// Tauri command for sending payload commands
#[tauri::command]
async fn send_payload_command(command: String) -> Result<String, String> {
    println!("Sending payload command: {}", command);
    // In a real implementation, this would send the command to the payload system
    Ok(format!("Command '{}' sent successfully", command))
}

// UDP Listener for MAVLink data (port 14550)
async fn start_mavlink_listener(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let socket = UdpSocket::bind("0.0.0.0:14550").await?;
    println!("MAVLink UDP listener started on port 14550");

    let mut buf = [0; 1024];
    
    loop {
        match socket.recv_from(&mut buf).await {
            Ok((len, _addr)) => {
                let data = &buf[..len];
                
                // Try to parse as JSON (from our simulator)
                if let Ok(json_str) = std::str::from_utf8(data) {
                    if let Ok(packet) = serde_json::from_str::<MAVLinkPacket>(json_str) {
                        let timestamp = chrono::Utc::now().format("%H:%M:%S").to_string();
                        
                        let mut event_data = serde_json::Map::new();
                        
                        // Add all available data fields
                        if let Some(lat) = packet.lat {
                            event_data.insert("lat".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(lat).unwrap()));
                        }
                        if let Some(lon) = packet.lon {
                            event_data.insert("lon".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(lon).unwrap()));
                        }
                        if let Some(alt) = packet.alt {
                            event_data.insert("alt".to_string(), serde_json::Value::Number(serde_json::Number::from(alt)));
                        }
                        if let Some(battery) = packet.battery_remaining {
                            event_data.insert("battery_remaining".to_string(), serde_json::Value::Number(serde_json::Number::from(battery)));
                        }
                        if let Some(heading) = packet.heading {
                            event_data.insert("heading".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(heading).unwrap()));
                        }
                        if let Some(status) = packet.system_status {
                            event_data.insert("system_status".to_string(), serde_json::Value::String(status));
                        }

                        let event = BackendEvent {
                            timestamp: timestamp.clone(),
                            source: "DRONE".to_string(),
                            message: format!("Position update: {}", packet.packet_type),
                            data: Some(serde_json::Value::Object(event_data)),
                        };

                        // Use the ORIGINAL event name from your code
                        let _ = app_handle.emit("new-backend-event", serde_json::to_string(&event).unwrap());
                        println!("✅ Emitted MAVLink event: {:?}", event);
                    }
                }
            }
            Err(e) => {
                eprintln!("UDP receive error: {}", e);
            }
        }
    }
}

// TCP Listener for Payload data (port 9001)
async fn start_payload_listener(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind("0.0.0.0:9001").await?;
    println!("🚀 Payload TCP listener started on port 9001");

    loop {
        match listener.accept().await {
            Ok((mut socket, addr)) => {
                println!("🔗 NEW TCP CONNECTION from: {}", addr);
                let app_handle = app_handle.clone();
                
                tokio::spawn(async move {
                    let mut buf = [0; 1024];
                    
                    // Keep reading data in a loop until connection closes
                    loop {
                        println!("📡 Waiting to read data from {}", addr);
                        
                        match socket.read(&mut buf).await {
                            Ok(0) => {
                                println!("🔌 Connection closed by client: {}", addr);
                                break; // Exit the loop when client closes connection
                            }
                            Ok(len) => {
                                println!("📥 Read {} bytes from {}", len, addr);
                                let data = &buf[..len];
                                
                                match std::str::from_utf8(data) {
                                    Ok(raw_command) => {
                                        // Handle multiple commands or metadata
                                        for line in raw_command.lines() {
                                            let clean_command = line.trim();
                                            
                                            if !clean_command.is_empty() && !clean_command.starts_with("METADATA:") {
                                                println!("✅ Processing command: '{}'", clean_command);
                                                
                                                let timestamp = chrono::Utc::now().format("%H:%M:%S").to_string();
                                                
                                                let event = BackendEvent {
                                                    timestamp: timestamp.clone(),
                                                    source: "PAYLOAD".to_string(),
                                                    message: format!("Command: {}", clean_command),
                                                    data: Some(serde_json::json!({
                                                        "command": clean_command,
                                                        "sender": addr.to_string()
                                                    })),
                                                };

                                                // Use the ORIGINAL event name from your code
                                                match app_handle.emit("new-backend-event", serde_json::to_string(&event).unwrap()) {
                                                    Ok(_) => println!("🎉 Successfully emitted payload event!"),
                                                    Err(e) => println!("❌ Failed to emit event: {}", e),
                                                }
                                                
                                                println!("📤 Event details: {:?}", event);
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        println!("❌ Failed to parse UTF8: {}", e);
                                        println!("📊 Raw bytes: {:?}", data);
                                    }
                                }
                                
                                // Send acknowledgment back to client (optional)
                                if let Err(e) = socket.write_all(b"ACK\n").await {
                                    println!("❌ Failed to send ACK: {}", e);
                                    break;
                                }
                            }
                            Err(e) => {
                                println!("❌ TCP read error from {}: {}", addr, e);
                                break; // Exit loop on error
                            }
                        }
                    }
                    
                    println!("🔌 TCP handler for {} finished", addr);
                });
            }
            Err(e) => {
                eprintln!("❌ TCP accept error: {}", e);
            }
        }
    }
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_payload_command])
        .setup(|app| {
            let app_handle = app.handle();
            
            // Start MAVLink UDP listener
            let app_handle_mavlink = app_handle.clone();
            tokio::spawn(async move {
                if let Err(e) = start_mavlink_listener(app_handle_mavlink).await {
                    eprintln!("MAVLink listener error: {}", e);
                }
            });

            // Start Payload TCP listener
            let app_handle_payload = app_handle.clone();
            tokio::spawn(async move {
                if let Err(e) = start_payload_listener(app_handle_payload).await {
                    eprintln!("Payload listener error: {}", e);
                }
            });

            println!("Mission Control Hub initialized successfully!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
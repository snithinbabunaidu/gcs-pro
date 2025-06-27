import React from 'react';
import styles from './TelemetryOverlay.module.css';

interface TelemetryProps {
  altitude: number;
  speed: number;
  battery: number;
  heading: number;
  status: string;
}

export const TelemetryOverlay: React.FC<TelemetryProps> = ({ 
  altitude, 
  speed, 
  battery, 
  heading, 
  status 
}) => {
  // Determine battery color based on level
  const getBatteryColor = (level: number) => {
    if (level > 50) return '#4CAF50'; // Green
    if (level > 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Format heading to show cardinal direction
  const getCardinalDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'auto':
        return '#4CAF50';
      case 'standby':
        return '#2196F3';
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div className={styles.telemetryContainer}>
      <div className={styles.telemetryHeader}>
        <h3>TELEMETRY</h3>
        <div 
          className={styles.statusIndicator}
          style={{ backgroundColor: getStatusColor(status) }}
        >
          {status}
        </div>
      </div>
      
      <div className={styles.telemetryGrid}>
        <div className={styles.telemetryItem}>
          <div className={styles.telemetryLabel}>ALTITUDE</div>
          <div className={styles.telemetryValue}>
            <strong>{altitude.toFixed(1)}</strong>
            <span className={styles.unit}>m</span>
          </div>
        </div>

        <div className={styles.telemetryItem}>
          <div className={styles.telemetryLabel}>SPEED</div>
          <div className={styles.telemetryValue}>
            <strong>{speed.toFixed(1)}</strong>
            <span className={styles.unit}>m/s</span>
          </div>
        </div>

        <div className={styles.telemetryItem}>
          <div className={styles.telemetryLabel}>BATTERY</div>
          <div className={styles.telemetryValue}>
            <strong style={{ color: getBatteryColor(battery) }}>
              {Math.round(battery)}
            </strong>
            <span className={styles.unit}>%</span>
          </div>
          <div className={styles.batteryBar}>
            <div 
              className={styles.batteryLevel}
              style={{ 
                width: `${Math.max(0, Math.min(100, battery))}%`,
                backgroundColor: getBatteryColor(battery)
              }}
            />
          </div>
        </div>

        <div className={styles.telemetryItem}>
          <div className={styles.telemetryLabel}>HEADING</div>
          <div className={styles.telemetryValue}>
            <strong>{Math.round(heading)}°</strong>
            <span className={styles.unit}>{getCardinalDirection(heading)}</span>
          </div>
        </div>
      </div>

      <div className={styles.timestamp}>
        Last Update: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};
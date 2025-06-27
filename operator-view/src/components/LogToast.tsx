import React, { useEffect, useState } from 'react';
import styles from './LogToast.module.css';

interface Log {
  id: number;
  message: string;
  level: 'INFO' | 'WARN' | 'CRITICAL';
  timestamp: string;
}

interface LogToastProps {
  log: Log;
  onDismiss: () => void;
}

export const LogToast: React.FC<LogToastProps> = ({ log, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match CSS animation duration
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '🚨';
      case 'WARN':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '#F44336';
      case 'WARN':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  return (
    <div 
      className={`${styles.logToast} ${styles[log.level.toLowerCase()]} ${
        isVisible && !isExiting ? styles.visible : ''
      } ${isExiting ? styles.exiting : ''}`}
      onClick={handleDismiss}
    >
      <div className={styles.toastHeader}>
        <div className={styles.toastIcon}>
          {getLogIcon(log.level)}
        </div>
        <div className={styles.toastLevel} style={{ color: getLogColor(log.level) }}>
          {log.level}
        </div>
        <div className={styles.toastTimestamp}>
          {log.timestamp}
        </div>
        <button className={styles.dismissButton} onClick={handleDismiss}>
          ×
        </button>
      </div>
      
      <div className={styles.toastMessage}>
        {log.message}
      </div>
      
      <div 
        className={styles.progressBar}
        style={{ backgroundColor: getLogColor(log.level) }}
      />
    </div>
  );
};
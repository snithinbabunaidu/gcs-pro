import React, { useRef, useEffect, useState } from 'react';
import { TelemetryOverlay } from './TelemetryOverlay';
import styles from './VideoView.module.css';

interface VideoViewProps {
  telemetry: {
    altitude: number;
    speed: number;
    battery: number;
    heading: number;
    status: string;
  };
  onMapToggle: () => void;
}

export const VideoView: React.FC<VideoViewProps> = ({ telemetry, onMapToggle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoControls, setVideoControls] = useState({
    playing: true,
    muted: true,
    volume: 0.5,
    quality: 'HD'
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await videoRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoControls.playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoControls(prev => ({ ...prev, playing: !prev.playing }));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoControls.muted;
      setVideoControls(prev => ({ ...prev, muted: !prev.muted }));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setVideoControls(prev => ({ ...prev, volume, muted: volume === 0 }));
    }
  };

  return (
    <div className={styles.videoViewContainer}>
      {/* Main Video Feed */}
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.mainVideo}
          autoPlay
          loop
          muted={videoControls.muted}
          playsInline
        >
          <source src="/drone-footage.mp4" type="video/mp4" />
          <div className={styles.videoPlaceholder}>
            <div className={styles.cameraIcon}>📹</div>
            <h2>Live Camera Feed</h2>
            <p>1920x1080 • 30fps • H.264</p>
            <div className={styles.signalStrength}>
              <span>Signal: ████████░░ 80%</span>
            </div>
          </div>
        </video>

        {/* Video Overlay Info */}
        <div className={styles.videoOverlay}>
          <div className={styles.recordingIndicator}>
            <div className={styles.recordingDot}></div>
            <span>REC</span>
          </div>
          
          <div className={styles.streamInfo}>
            <div>HD • 30fps</div>
            <div>LIVE</div>
          </div>
        </div>

        {/* Video Controls */}
        <div className={styles.videoControls}>
          <button 
            className={styles.controlBtn}
            onClick={togglePlayPause}
            title={videoControls.playing ? 'Pause' : 'Play'}
          >
            {videoControls.playing ? '⏸️' : '▶️'}
          </button>
          
          <button 
            className={styles.controlBtn}
            onClick={toggleMute}
            title={videoControls.muted ? 'Unmute' : 'Mute'}
          >
            {videoControls.muted ? '🔇' : '🔊'}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={videoControls.volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
          />
          
          <select 
            className={styles.qualitySelect}
            value={videoControls.quality}
            onChange={(e) => setVideoControls(prev => ({ ...prev, quality: e.target.value }))}
          >
            <option value="4K">4K</option>
            <option value="HD">HD</option>
            <option value="SD">SD</option>
          </select>
          
          <button 
            className={styles.controlBtn}
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Telemetry Overlay */}
      <TelemetryOverlay {...telemetry} />

      {/* Map Picture-in-Picture */}
      <div className={styles.mapPip} onClick={onMapToggle}>
        <div className={styles.pipHeader}>
          <span>MAP VIEW</span>
          <button className={styles.expandButton}>🗺️</button>
        </div>
        <div className={styles.mapPlaceholder}>
          <div className={styles.mapIcon}>🗺️</div>
          <p>Tactical Map</p>
          <div className={styles.coordinates}>
            47.6062°N, 122.3321°W
          </div>
        </div>
      </div>

      {/* Camera Controls Panel */}
      <div className={styles.cameraControls}>
        <h4>CAMERA CONTROLS</h4>
        
        <div className={styles.controlGroup}>
          <label>Zoom</label>
          <div className={styles.zoomControls}>
            <button className={styles.cameraBtn}>−</button>
            <span>2.5x</span>
            <button className={styles.cameraBtn}>+</button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Gimbal</label>
          <div className={styles.gimbalControls}>
            <button className={styles.gimbalBtn}>↑</button>
            <div className={styles.gimbalMiddle}>
              <button className={styles.gimbalBtn}>←</button>
              <div className={styles.gimbalCenter}>🎯</div>
              <button className={styles.gimbalBtn}>→</button>
            </div>
            <button className={styles.gimbalBtn}>↓</button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Mode</label>
          <select className={styles.modeSelect}>
            <option>Visible Light</option>
            <option>Thermal</option>
            <option>Night Vision</option>
          </select>
        </div>

        <button className={styles.captureBtn}>
          📸 CAPTURE
        </button>
      </div>
    </div>
  );
};
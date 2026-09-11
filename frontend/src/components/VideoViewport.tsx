import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Crosshair } from 'lucide-react';
import type { TrajectoryPoint, TrackingStatePill } from '../types/analysis';

interface VideoViewportProps {
  videoSrc: string;
  trajectoryPoints?: TrajectoryPoint[];
  rotationCenter?: { x: number; y: number };
  currentRpm?: number;
  currentWobble?: number;
  currentAccuracy?: number;
  trackingStatus?: TrackingStatePill;
  isProcessing?: boolean;
  progressPercent?: number;
}

export const VideoViewport: React.FC<VideoViewportProps> = ({
  videoSrc,
  trajectoryPoints = [],
  rotationCenter = { x: 960, y: 540 },
  currentRpm = 742,
  currentWobble = 3.8,
  currentAccuracy = 94,
  trackingStatus = 'TRACKING',
  isProcessing = false,
  progressPercent = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showHUD, setShowHUD] = useState(true);
  const [showTrail, setShowTrail] = useState(true);

  // Synchronize playback with canvas drawing
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animFrameId: number;

    const renderOverlay = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match canvas internal resolution to client display size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!showHUD) {
        animFrameId = requestAnimationFrame(renderOverlay);
        return;
      }

      const totalFrames = trajectoryPoints.length || 576;
      const progress = duration > 0 ? currentTime / duration : 0;
      const currentFrameIdx = Math.min(
        totalFrames - 1,
        Math.max(0, Math.floor(progress * totalFrames))
      );

      // Coordinate scale factors (assuming reference video 1920x1080)
      const scaleX = canvas.width / 1920;
      const scaleY = canvas.height / 1080;

      // Draw Center Marker
      const centerScreenX = rotationCenter.x * scaleX;
      const centerScreenY = rotationCenter.y * scaleY;

      // Subtle Center Reticle
      ctx.strokeStyle = 'rgba(36, 136, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#2488FF';
      ctx.beginPath();
      ctx.arc(centerScreenX, centerScreenY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Center label
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(244, 245, 247, 0.8)';
      ctx.fillText('● ROTATION CENTER', centerScreenX + 10, centerScreenY - 10);

      // Draw Trajectory Trail
      if (showTrail && trajectoryPoints.length > 0) {
        const trailLookback = 60; // show past 60 frames of trail
        const startIdx = Math.max(0, currentFrameIdx - trailLookback);

        ctx.lineWidth = 2.5;
        for (let i = startIdx; i < currentFrameIdx; i++) {
          const p1 = trajectoryPoints[i];
          const p2 = trajectoryPoints[i + 1];
          if (!p1 || !p2) continue;

          const alpha = (i - startIdx) / (currentFrameIdx - startIdx || 1);
          ctx.strokeStyle = `rgba(192, 38, 255, ${alpha * 0.8})`;

          const x1 = (p1.center_x ?? p1.x + 45) * scaleX;
          const y1 = (p1.center_y ?? p1.y + 12) * scaleY;
          const x2 = (p2.center_x ?? p2.x + 45) * scaleX;
          const y2 = (p2.center_y ?? p2.y + 12) * scaleY;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Draw Current Pen Bounding Box
      const activePoint = trajectoryPoints[currentFrameIdx];
      if (activePoint) {
        const pCenterX = (activePoint.center_x ?? activePoint.x + 45) * scaleX;
        const pCenterY = (activePoint.center_y ?? activePoint.y + 12) * scaleY;
        const bWidth = (activePoint.width ?? 90) * scaleX;
        const bHeight = (activePoint.height ?? 24) * scaleY;
        const bX = pCenterX - bWidth / 2;
        const bY = pCenterY - bHeight / 2;

        const isEstimated = activePoint.tracking_state === 'estimated';

        // Bounding box outline
        ctx.strokeStyle = isEstimated ? '#FFB547' : '#36E2A0';
        ctx.lineWidth = 2;
        ctx.strokeRect(bX, bY, bWidth, bHeight);

        // Corner accents
        const cornerSize = 6;
        ctx.fillStyle = isEstimated ? '#FFB547' : '#36E2A0';
        ctx.fillRect(bX - 2, bY - 2, cornerSize, 2);
        ctx.fillRect(bX - 2, bY - 2, 2, cornerSize);
        ctx.fillRect(bX + bWidth - cornerSize + 2, bY - 2, cornerSize, 2);
        ctx.fillRect(bX + bWidth, bY - 2, 2, cornerSize);

        // Pen label
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = isEstimated ? '#FFB547' : '#36E2A0';
        ctx.fillText(isEstimated ? 'PEN [OCCLUDED]' : 'PEN MARKER', bX, bY - 6);

        // Radial connection line to center
        ctx.strokeStyle = 'rgba(244, 245, 247, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(centerScreenX, centerScreenY);
        ctx.lineTo(pCenterX, pCenterY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameId = requestAnimationFrame(renderOverlay);
    };

    animFrameId = requestAnimationFrame(renderOverlay);
    return () => cancelAnimationFrame(animFrameId);
  }, [currentTime, duration, trajectoryPoints, rotationCenter, showHUD, showTrail]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Video + Canvas Viewport Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#040507',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
      }}>
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
        />

        {/* HUD Canvas Overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />

        {/* Processing State Overlay */}
        {isProcessing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(11, 12, 15, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--accent-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Analyzing Spin Dynamics... {progressPercent}%
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tracking contours & extracting angular velocity
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ width: '280px', height: '6px', backgroundColor: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-blue)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* HUD Header Telemetry Overlays */}
        {showHUD && !isProcessing && (
          <>
            {/* Top Left: Tracking status pill */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 5 }}>
              <span className={`status-pill ${trackingStatus.toLowerCase().replace(' ', '-')}`}>
                <span className="indicator-dot" />
                {trackingStatus}
              </span>
            </div>

            {/* Top Right: Frame counter */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(17, 19, 24, 0.8)',
              border: '1px solid rgba(41, 45, 53, 0.8)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              zIndex: 5,
            }}>
              FRAME {String(Math.floor((duration > 0 ? currentTime / duration : 0) * (trajectoryPoints.length || 576))).padStart(4, '0')} / {trajectoryPoints.length || 576}
            </div>

            {/* Bottom Left: Live Metric Readout HUD */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              backgroundColor: 'rgba(11, 12, 15, 0.85)',
              border: '1px solid rgba(41, 45, 53, 0.8)',
              borderRadius: '8px',
              padding: '8px 14px',
              display: 'flex',
              gap: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              zIndex: 5,
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>RPM </span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{currentRpm}</span>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>CENTER </span>
                <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>{currentAccuracy}%</span>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>WOBBLE </span>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{currentWobble}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Video Scrub Bar & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '10px 18px',
        gap: '16px',
      }}>
        {/* Play/Pause & Restart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={togglePlay}
            style={{
              background: 'var(--accent-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={restartVideo}
            title="Restart"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Time Scrubber */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '36px' }}>
            {currentTime.toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (videoRef.current) videoRef.current.currentTime = val;
              setCurrentTime(val);
            }}
            style={{
              flex: 1,
              accentColor: 'var(--accent-blue)',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '36px' }}>
            {duration.toFixed(1)}s
          </span>
        </div>

        {/* Playback speed & HUD toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Speed toggles: useful for 120/240 FPS slow-motion inspection */}
          {[0.25, 0.5, 1].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              style={{
                background: playbackRate === rate ? 'var(--bg-secondary)' : 'transparent',
                color: playbackRate === rate ? 'var(--accent-blue)' : 'var(--text-muted)',
                border: `1px solid ${playbackRate === rate ? 'var(--accent-blue)' : 'transparent'}`,
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              {rate}x
            </button>
          ))}

          {/* Trail Toggle */}
          <button
            onClick={() => setShowTrail(!showTrail)}
            title={showTrail ? 'Hide Trail' : 'Show Trail'}
            style={{
              background: showTrail ? 'var(--accent-purple-dim)' : 'transparent',
              color: showTrail ? 'var(--accent-purple)' : 'var(--text-muted)',
              border: `1px solid ${showTrail ? 'rgba(192, 38, 255, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <span>TRAIL</span>
          </button>

          {/* HUD Toggle */}
          <button
            onClick={() => setShowHUD(!showHUD)}
            title={showHUD ? 'Hide HUD' : 'Show HUD'}
            style={{
              background: showHUD ? 'var(--accent-blue-dim)' : 'transparent',
              color: showHUD ? 'var(--accent-blue)' : 'var(--text-muted)',
              border: `1px solid ${showHUD ? 'rgba(36, 136, 255, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '5px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Crosshair size={14} />
            <span>HUD</span>
          </button>
        </div>
      </div>
    </div>
  );
};

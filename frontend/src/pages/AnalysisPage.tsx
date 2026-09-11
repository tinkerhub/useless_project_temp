import React from 'react';
import type { StatusResponse, VideoFileValidation } from '../types/analysis';
import { VideoViewport } from '../components/VideoViewport';

interface AnalysisPageProps {
  status: StatusResponse | null;
  validation: VideoFileValidation | null;
  onCancel: () => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  status,
  validation,
  onCancel,
}) => {
  const progress = status?.progress ?? 0;
  const currentFrame = status?.current_frame ?? 0;
  const totalFrames = status?.total_frames ?? 576;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Header telemetry info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-blue)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span className="indicator-dot" />
            COMPUTER VISION INGESTION PIPELINE
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            Tracking & Kinematic Analysis
          </h2>
        </div>

        <button onClick={onCancel} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          Cancel Analysis
        </button>
      </div>

      {/* Main Grid: Video Scan + Processing Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.4fr) 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>
        {/* Left: Video Viewport in Processing State */}
        <div>
          <VideoViewport
            videoSrc={validation?.previewUrl || ''}
            isProcessing={true}
            progressPercent={progress}
            trackingStatus={progress > 30 ? 'TRACKING' : 'CALIBRATING'}
          />
        </div>

        {/* Right: Real-time Telemetry Pipeline Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="telemetry-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                PIPELINE STATUS
              </span>
              <span className="status-pill calibrating">
                <span className="indicator-dot" />
                {progress < 100 ? 'PROCESSING' : 'COMPLETED'}
              </span>
            </div>

            {/* Frame Progress Readout */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Frames Processed</span>
                <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {currentFrame} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {totalFrames}</span>
                </span>
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '10px',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: 'var(--accent-blue)',
                  transition: 'width 0.25s ease',
                }} />
              </div>
            </div>

            {/* Analysis Steps Checklist (from APP_FLOW.md Step 4) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: progress >= 15 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: progress >= 15 ? 'var(--status-success-dim)' : 'var(--bg-secondary)',
                  color: progress >= 15 ? 'var(--status-success)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}>
                  {progress >= 15 ? '✓' : '1'}
                </div>
                <span>Frame Extraction & Decodability Verification</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: progress >= 40 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: progress >= 40 ? 'var(--status-success-dim)' : 'var(--bg-secondary)',
                  color: progress >= 40 ? 'var(--status-success)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}>
                  {progress >= 40 ? '✓' : '2'}
                </div>
                <span>HSV Pen Marker & Contour Bounding Box</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: progress >= 70 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: progress >= 70 ? 'var(--status-success-dim)' : 'var(--bg-secondary)',
                  color: progress >= 70 ? 'var(--status-success)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}>
                  {progress >= 70 ? '✓' : '3'}
                </div>
                <span>Hand Landmarks & Finger Rotation Center</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: progress >= 90 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: progress >= 90 ? 'var(--status-success-dim)' : 'var(--bg-secondary)',
                  color: progress >= 90 ? 'var(--status-success)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}>
                  {progress >= 90 ? '✓' : '4'}
                </div>
                <span>Kinematic Derivatives, Angular Velocity & RMS Wobble</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

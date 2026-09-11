import React from 'react';
import { Upload, Play, Activity, ArrowRight, Zap, Target } from 'lucide-react';

interface HomePageProps {
  onStartUpload: () => void;
  onLoadSample: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartUpload, onLoadSample }) => {
  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '48px',
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
      }}>
        {/* Glow pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: 'var(--accent-blue-dim)',
          border: '1px solid rgba(36, 136, 255, 0.3)',
          color: 'var(--accent-blue)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}>
          <span className="indicator-dot" />
          CV-POWERED PEN FLIP TELEMETRY ENGINE
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          color: 'var(--text-primary)',
          maxWidth: '850px',
        }}>
          Quantum Pen Flip Predictor
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          maxWidth: '640px',
          lineHeight: 1.6,
        }}>
          Upload a high-frame-rate pen-spinning video and analyze your technique. 
          Extract angular RPM, rotation axis accuracy, and orbital wobble stability.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '12px',
        }}>
          <button
            className="btn-primary"
            onClick={onStartUpload}
            style={{ padding: '16px 36px', fontSize: '16px' }}
          >
            <Upload size={18} />
            <span>Upload Video</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn-secondary"
            onClick={onLoadSample}
            style={{ padding: '16px 24px', fontSize: '15px' }}
          >
            <Play size={16} color="var(--accent-purple)" />
            <span>Load Sample Demo (240 FPS)</span>
          </button>
        </div>
      </div>

      {/* Feature Pillar Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '16px',
      }}>
        <div className="telemetry-card">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-blue-dim)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Zap size={20} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Angular Velocity (RPM)
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            Calculates exact angular displacement using coordinate atan2 tracking with frame-based angle unwrapping up to 240 FPS.
          </p>
        </div>

        <div className="telemetry-card">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(54, 226, 160, 0.1)',
            color: 'var(--status-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Target size={20} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Finger Center Accuracy
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            Detects hand landmarks and finger rotation axis to evaluate radial distance deviation and center position tolerance.
          </p>
        </div>

        <div className="telemetry-card">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--accent-purple-dim)',
            color: 'var(--accent-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Activity size={20} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Wobble & Gyroscopic Stability
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            Measures normalized RMS path deviation from an ideal circular trajectory to quantify spin stability and balance.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertCircle, RotateCcw, AlertTriangle } from 'lucide-react';

interface ErrorAlertProps {
  code: string;
  message: string;
  onReset: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ code, message, onReset }) => {
  const isTrackingLost = code === 'TRACKING_LOST';

  return (
    <div style={{
      backgroundColor: isTrackingLost ? 'rgba(255, 181, 71, 0.08)' : 'rgba(255, 77, 90, 0.08)',
      border: `1px solid ${isTrackingLost ? 'rgba(255, 181, 71, 0.3)' : 'rgba(255, 77, 90, 0.3)'}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          padding: '10px',
          borderRadius: '50%',
          backgroundColor: isTrackingLost ? 'rgba(255, 181, 71, 0.15)' : 'rgba(255, 77, 90, 0.15)',
          color: isTrackingLost ? 'var(--status-warning)' : 'var(--status-danger)',
        }}>
          {isTrackingLost ? <AlertTriangle size={24} /> : <AlertCircle size={24} />}
        </div>
        <div>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: isTrackingLost ? 'var(--status-warning)' : 'var(--status-danger)',
            letterSpacing: '0.05em',
          }}>
            ERROR CODE: {code}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {message}
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="btn-secondary"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <RotateCcw size={14} />
        <span>Try Another Video</span>
      </button>
    </div>
  );
};

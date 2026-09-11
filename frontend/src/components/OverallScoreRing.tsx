import React from 'react';

interface OverallScoreRingProps {
  score: number; // 0 - 100
  title?: string;
  subtitle?: string;
}

export const OverallScoreRing: React.FC<OverallScoreRingProps> = ({
  score = 87,
  title = 'TECHNIQUE SCORE',
  subtitle = 'Excellent Gyroscopic Stability & Control',
}) => {
  const radius = 64;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="telemetry-card" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(36, 136, 255, 0.08) 0%, rgba(192, 38, 255, 0.03) 70%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        marginBottom: '16px',
        fontFamily: 'var(--font-mono)',
      }}>
        {title}
      </div>

      {/* SVG Circular Progress Ring */}
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            stroke="var(--border-subtle)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress bar gradient */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-blue)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
          </defs>
          <circle
            stroke="url(#scoreGradient)"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Center Score readout */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '38px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.04em',
          }}>
            {score}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '2px',
            fontFamily: 'var(--font-mono)',
          }}>
            / 100
          </div>
        </div>
      </div>

      {/* Descriptive rating tag */}
      <div style={{
        marginTop: '16px',
        fontSize: '13px',
        fontWeight: 600,
        color: score >= 80 ? 'var(--status-success)' : score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)',
      }}>
        {score >= 85 ? 'EXCELLENT TECHNIQUE' : score >= 70 ? 'STABLE SPIN' : 'UNSTABLE ROTATION'}
      </div>

      <div style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '4px',
        maxWidth: '220px',
      }}>
        {subtitle}
      </div>
    </div>
  );
};

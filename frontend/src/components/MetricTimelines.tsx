import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

interface MetricTimelinesProps {
  totalDuration?: number; // seconds
  baseRpm?: number;
  baseWobble?: number;
}

export const MetricTimelines: React.FC<MetricTimelinesProps> = ({
  totalDuration = 2.4,
  baseRpm = 742,
  baseWobble = 3.8,
}) => {
  // Generate sample points across 30 time steps
  const steps = 32;
  const rpmData: { time: number; value: number }[] = [];
  const wobbleData: { time: number; value: number }[] = [];

  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * totalDuration;
    // Speed curve: starts high, accelerates, peaks, stabilizes
    const rpmVariation = Math.sin(i * 0.3) * 45 + (i > 15 && i < 24 ? 35 : -15);
    rpmData.push({ time: t, value: Math.round(baseRpm + rpmVariation) });

    // Wobble curve: settles down as rotation stabilizes
    const wobbleVariation = Math.sin(i * 0.4) * 0.8 + (i < 8 ? 1.5 : 0);
    wobbleData.push({ time: t, value: Number(Math.max(1.2, baseWobble + wobbleVariation).toFixed(1)) });
  }

  // Generate SVG path string
  const renderSvgPath = (
    data: { time: number; value: number }[],
    minVal: number,
    maxVal: number,
    width = 400,
    height = 90
  ) => {
    const points = data.map((d, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const normalizedY = (d.value - minVal) / (maxVal - minVal || 1);
      const y = height - normalizedY * (height - 20) - 10;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const rpmMin = Math.min(...rpmData.map((d) => d.value)) - 20;
  const rpmMax = Math.max(...rpmData.map((d) => d.value)) + 20;

  const wobbleMin = 0;
  const wobbleMax = Math.max(...wobbleData.map((d) => d.value)) + 2;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '16px',
    }}>
      {/* RPM Timeline Chart */}
      <div className="telemetry-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={15} color="var(--accent-blue)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              RPM Dynamic Timeline
            </span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            PEAK {rpmMax - 20} RPM
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--border-subtle)',
        }}>
          <svg viewBox="0 0 400 90" style={{ width: '100%', height: '80px', display: 'block' }}>
            {/* Subtle horizontal gridlines */}
            <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            {/* Path */}
            <path
              d={renderSvgPath(rpmData, rpmMin, rpmMax)}
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>0.0s</span>
            <span>{(totalDuration / 2).toFixed(1)}s</span>
            <span>{totalDuration.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Wobble Timeline Chart */}
      <div className="telemetry-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="var(--accent-purple)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Wobble Perturbation Timeline
            </span>
          </div>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            STABLE DRIFT
          </span>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--border-subtle)',
        }}>
          <svg viewBox="0 0 400 90" style={{ width: '100%', height: '80px', display: 'block' }}>
            <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            <path
              d={renderSvgPath(wobbleData, wobbleMin, wobbleMax)}
              fill="none"
              stroke="var(--accent-purple)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>0.0s</span>
            <span>{(totalDuration / 2).toFixed(1)}s</span>
            <span>{totalDuration.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { AnalysisResponse, TrajectoryResponse } from '../types/analysis';
import { VideoViewport } from '../components/VideoViewport';
import { OverallScoreRing } from '../components/OverallScoreRing';
import { MetricCards } from '../components/MetricCards';
import { TrajectoryCanvas } from '../components/TrajectoryCanvas';
import { MetricTimelines } from '../components/MetricTimelines';
import { Download, RotateCcw, CheckCircle } from 'lucide-react';

interface ResultsPageProps {
  analysis: AnalysisResponse;
  trajectory: TrajectoryResponse | null;
  videoSrc: string;
  onNewAnalysis: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  analysis,
  trajectory,
  videoSrc,
  onNewAnalysis,
}) => {
  const results = analysis.results;
  if (!results) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No analysis results available.
      </div>
    );
  }

  // If backend provided overall_score use it, otherwise derive cleanly
  const overallScore =
    results.overall_score ??
    Math.round(
      Math.min(100, Math.max(0, (results.center_accuracy * 0.45) + ((100 - results.wobble_percent * 5) * 0.35) + (Math.min(100, results.rpm / 8) * 0.2)))
    );

  const points = trajectory?.points || [];
  const rotationCenter = trajectory?.rotation_center || { x: 960, y: 540 };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ analysis, trajectory }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `penflip_analysis_${analysis.analysis_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
    }}>
      {/* Top Bar: Title & Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--status-success)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.06em',
          }}>
            <CheckCircle size={14} color="var(--status-success)" />
            ANALYSIS COMPLETE · ID #{analysis.analysis_id}
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            Technique & Performance Results
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleExportJson}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: '13px' }}
          >
            <Download size={15} />
            <span>Export JSON Telemetry</span>
          </button>

          <button
            onClick={onNewAnalysis}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            <RotateCcw size={15} />
            <span>Analyze New Video</span>
          </button>
        </div>
      </div>

      {/* TOP ZONE: Replay Video Viewport (60%) + Score Card & Key Summary (40%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(280px, 1fr)',
        gap: '24px',
        alignItems: 'stretch',
      }}>
        {/* Left: Replay Video with synchronized HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ANALYSIS REPLAY & INTERACTIVE HUD
          </div>
          <VideoViewport
            videoSrc={videoSrc}
            trajectoryPoints={points}
            rotationCenter={rotationCenter}
            currentRpm={Math.round(results.rpm)}
            currentAccuracy={Math.round(results.center_accuracy)}
            currentWobble={results.wobble_percent}
            trackingStatus="TRACKING"
          />
        </div>

        {/* Right: Technique Score Ring & Summary Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            OVERALL TECHNIQUE EVALUATION
          </div>
          <OverallScoreRing
            score={overallScore}
            title="OVERALL TECHNIQUE SCORE"
            subtitle="Calculated from angular velocity, center accuracy & orbital stability."
          />

          {/* Quick breakdown panel */}
          <div className="telemetry-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              CORE TELEMETRY SUMMARY
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frame Rate</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                {analysis.video?.fps || 240} FPS
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration / Frames</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {analysis.video?.duration || 2.4}s ({analysis.video?.total_frames || 576} frames)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Confidence Metric</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--status-success)' }}>
                {results.tracking_confidence.toFixed(1)}% High
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ZONE: Metric Cards (RPM, Center, Wobble + Kinetics) */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
          PERFORMANCE BREAKDOWN
        </div>
        <MetricCards results={results} />
      </div>

      {/* BOTTOM ZONE: Trajectory Canvas & Dynamic Timelines */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)',
        gap: '24px',
      }}>
        {/* Trajectory Plot */}
        <TrajectoryCanvas
          points={points}
          rotationCenter={rotationCenter}
        />

        {/* Timelines */}
        <MetricTimelines
          totalDuration={analysis.video?.duration || 2.4}
          baseRpm={results.rpm}
          baseWobble={results.wobble_percent}
        />
      </div>
    </div>
  );
};

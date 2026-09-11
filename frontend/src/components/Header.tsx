import React from 'react';
import { Activity, Radio, Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'upload' | 'analysis' | 'results' | 'replay';
  onSelectTab: (tab: 'home' | 'upload' | 'analysis' | 'results' | 'replay') => void;
  hasAnalysis: boolean;
  isMockMode: boolean;
  onToggleMock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  hasAnalysis,
  isMockMode,
  onToggleMock,
}) => {
  return (
    <header style={{
      height: '68px',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: Logo + Wordmark */}
      <div 
        onClick={() => onSelectTab('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          backgroundColor: 'var(--accent-blue-dim)',
          border: '1px solid var(--accent-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-blue)',
        }}>
          <Activity size={20} />
        </div>
        <div>
          <div style={{
            fontSize: '15px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Quantum Pen Flip Predictor
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(36, 136, 255, 0.1)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(36, 136, 255, 0.2)',
            }}>
              v1.0-CV
            </span>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '-2px',
          }}>
            Kinetic Spin Telemetry & Computer Vision Analysis
          </div>
        </div>
      </div>

      {/* Center: Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={() => onSelectTab('home')}
          style={{
            background: currentTab === 'home' || currentTab === 'upload' ? 'var(--bg-card)' : 'transparent',
            color: currentTab === 'home' || currentTab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Upload / Ingest
        </button>

        <button
          onClick={() => onSelectTab('analysis')}
          disabled={!hasAnalysis && currentTab !== 'analysis'}
          style={{
            background: currentTab === 'analysis' ? 'var(--bg-card)' : 'transparent',
            color: currentTab === 'analysis' ? 'var(--accent-blue)' : (hasAnalysis ? 'var(--text-secondary)' : 'var(--text-muted)'),
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: hasAnalysis || currentTab === 'analysis' ? 'pointer' : 'not-allowed',
            opacity: hasAnalysis || currentTab === 'analysis' ? 1 : 0.4,
            transition: 'all 0.15s ease',
          }}
        >
          Analysis HUD
        </button>

        <button
          onClick={() => onSelectTab('results')}
          disabled={!hasAnalysis}
          style={{
            background: currentTab === 'results' || currentTab === 'replay' ? 'var(--bg-card)' : 'transparent',
            color: currentTab === 'results' || currentTab === 'replay' ? 'var(--accent-purple)' : (hasAnalysis ? 'var(--text-secondary)' : 'var(--text-muted)'),
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: hasAnalysis ? 'pointer' : 'not-allowed',
            opacity: hasAnalysis ? 1 : 0.4,
            transition: 'all 0.15s ease',
          }}
        >
          Results & Replay
        </button>
      </nav>

      {/* Right: API Mode / Environment Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleMock}
          title="Toggle between Backend Live API and Simulated Local Engine"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: isMockMode ? 'rgba(192, 38, 255, 0.1)' : 'rgba(54, 226, 160, 0.1)',
            border: `1px solid ${isMockMode ? 'rgba(192, 38, 255, 0.3)' : 'rgba(54, 226, 160, 0.3)'}`,
            color: isMockMode ? 'var(--accent-purple)' : 'var(--status-success)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}
        >
          {isMockMode ? <Cpu size={14} /> : <Radio size={14} />}
          <span>{isMockMode ? 'MOCK ENGINE' : 'LIVE API'}</span>
          <RefreshCw size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
        </button>
      </div>
    </header>
  );
};

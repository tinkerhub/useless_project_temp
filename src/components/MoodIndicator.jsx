import React, { useState } from 'react';

const MOOD_META = {
  excited: { emoji: '⚡', name: 'Excited', color: '#FFD166', textColor: '#5E4200' },
  sad: { emoji: '🌧️', name: 'Sad', color: '#4A6B82', textColor: '#FFFFFF' },
  angry: { emoji: '💢', name: 'Angry', color: '#FF4B4B', textColor: '#FFFFFF' },
  dramatic: { emoji: '🎭', name: 'Dramatic', color: '#5A189A', textColor: '#FFFFFF' },
  sleepy: { emoji: '💤', name: 'Sleepy', color: '#1E1B4B', textColor: '#D1C7FF' },
  shy: { emoji: '🌸', name: 'Shy', color: '#FAD2E1', textColor: '#5C1D36' },
  confused: { emoji: '❓', name: 'Confused', color: '#B8B8D1', textColor: '#2B2B4A' },
  toddler: { emoji: '🧸', name: 'Toddler', color: '#FFE29A', textColor: '#5E4200' },
  overprotective: { emoji: '🛡️', name: 'Overprotective', color: '#C9E4CA', textColor: '#1A4D1D' },
  bargainer: { emoji: '🤝', name: 'Bargainer', color: '#FFB347', textColor: '#592D00' },
};

export default function MoodIndicator({ mood, intensity, moodReason }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const activeMood = mood || 'excited';
  const meta = MOOD_META[activeMood] || MOOD_META.excited;
  const currentIntensity = intensity ?? 50;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        margin: '12px auto 0 auto',
        padding: '6px 14px',
        borderRadius: '999px',
        backgroundColor: meta.color,
        color: meta.textColor,
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <span style={{ fontSize: '16px' }}>{meta.emoji}</span>
      <span>{meta.name}</span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingLeft: '6px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
          fontSize: '12px',
          opacity: 0.9,
        }}
      >
        <span>{currentIntensity}%</span>
      </div>

      {/* Tooltip on hover/click showing moodReason */}
      {showTooltip && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            borderRadius: '12px',
            color: '#1A1A2E',
            fontSize: '13px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'none',
          }}
        >
          {moodReason || `Pompom is currently feeling ${meta.name.toLowerCase()}.`}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(255, 255, 255, 0.85)',
            }}
          />
        </div>
      )}
    </div>
  );
}

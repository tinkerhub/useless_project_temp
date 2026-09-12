import React from 'react';

export default function ThinkingState() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '10px 0',
        padding: '10px 16px',
        borderRadius: '18px 18px 18px 4px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        width: 'fit-content',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: '500', color: '#555' }}>
        Pompom is thinking
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#888',
            animation: 'pulse-breath 1s infinite ease-in-out',
            animationDelay: '0s',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#888',
            animation: 'pulse-breath 1s infinite ease-in-out',
            animationDelay: '0.2s',
          }}
        />
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#888',
            animation: 'pulse-breath 1s infinite ease-in-out',
            animationDelay: '0.4s',
          }}
        />
      </div>
    </div>
  );
}

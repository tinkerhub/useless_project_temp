import React from 'react';
import PompomAvatar from './PompomAvatar.jsx';
import { Sparkles } from 'lucide-react';

export default function LandingScreen({ onStartChat, initialMood }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center',
        animation: 'bubble-pop-in 0.6s ease-out',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          fontSize: '13px',
          fontWeight: '600',
          color: '#1A1A2E',
          marginBottom: '20px',
          fontFamily: 'Fredoka, sans-serif',
        }}
      >
        <Sparkles size={14} color="#FF4B4B" />
        <span>Mood-Driven Virtual Pet AI</span>
      </div>

      <div style={{ marginBottom: '16px', transform: 'scale(1.1)' }}>
        <PompomAvatar mood={initialMood?.mood || 'excited'} intensity={initialMood?.intensity || 50} />
      </div>

      <h1
        style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '3rem',
          fontWeight: '700',
          color: '#1A1A2E',
          marginBottom: '10px',
          letterSpacing: '-0.5px',
        }}
      >
        Meet Pompom.
      </h1>

      <p
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.25rem',
          color: 'rgba(26, 26, 46, 0.8)',
          maxWidth: '420px',
          marginBottom: '32px',
          lineHeight: '1.4',
        }}
      >
        You never know what mood you'll get. Every answer comes with a twist of personality!
      </p>

      <button
        onClick={onStartChat}
        style={{
          padding: '16px 36px',
          borderRadius: '999px',
          border: 'none',
          background: '#1A1A2E',
          color: '#FFFFFF',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '18px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.2s ease, boxShadow 0.2s ease',
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
      >
        Enter Pompom's World
      </button>
    </div>
  );
}

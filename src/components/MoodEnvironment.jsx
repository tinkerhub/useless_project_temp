import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const MOOD_BG_MAP = {
  angry: 'linear-gradient(135deg, #FF4B4B 0%, #D93838 100%)',
  shy: 'linear-gradient(135deg, #FAD2E1 0%, #F4B8CD 100%)',
  sleepy: 'linear-gradient(135deg, #1E1B4B 0%, #0F0D2A 100%)',
  excited: 'linear-gradient(135deg, #FFD166 0%, #F4B942 100%)',
  dramatic: 'linear-gradient(135deg, #5A189A 0%, #3C096C 100%)',
  sad: 'linear-gradient(135deg, #4A6B82 0%, #2D485B 100%)',
  confused: 'linear-gradient(135deg, #B8B8D1 0%, #9D9DBB 100%)',
  toddler: 'linear-gradient(135deg, #FFE29A 0%, #FFD670 100%)',
  overprotective: 'linear-gradient(135deg, #C9E4CA 0%, #A3CBA4 100%)',
  bargainer: 'linear-gradient(135deg, #FFB347 0%, #FF9E1B 100%)',
};

export default function MoodEnvironment({ mood, intensity }) {
  const currentMood = mood || 'excited';
  const backgroundStyle = MOOD_BG_MAP[currentMood] || MOOD_BG_MAP.excited;

  // Trigger confetti burst when mood becomes Excited at high intensity
  useEffect(() => {
    if (currentMood === 'excited' && intensity > 50) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.4 },
          colors: ['#FFD166', '#FF4B4B', '#BCE7FD', '#FFFFFF'],
        });
      } catch (e) {
        // Fallback silently if canvas-confetti has canvas issue
      }
    }
  }, [currentMood, intensity]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: backgroundStyle,
        transition: 'background 0.8s ease-in-out',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Mood-specific ambient overlays */}

      {/* DRAMATIC Spotlight effect */}
      {currentMood === 'dramatic' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '100%',
            background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* SAD Rain Effect */}
      {currentMood === 'sad' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${(i * 15) % 100}%`,
                left: `${(i * 8.3) % 100}%`,
                width: '2px',
                height: '24px',
                background: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '999px',
                animation: `rain-fall 1.2s infinite linear`,
                animationDelay: `${(i * 0.15) % 1.2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* SLEEPY Floating Zzz Particles */}
      {currentMood === 'sleepy' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${40 + (i * 10)}%`,
                left: `${20 + (i * 15)}%`,
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 'bold',
                fontSize: `${18 + i * 4}px`,
                animation: 'float-zzz 3s infinite ease-out',
                animationDelay: `${i * 0.6}s`,
              }}
            >
              Zzz
            </div>
          ))}
        </div>
      )}

      {/* SHY Sparkles */}
      {currentMood === 'shy' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${15 + (i * 10)}%`,
                left: `${10 + (i * 11)}%`,
                width: '6px',
                height: '6px',
                background: '#FFF',
                borderRadius: '50%',
                boxShadow: '0 0 10px #FFF',
                animation: 'pulse-breath 2s infinite ease-in-out',
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ANGRY Steam / Heat glow */}
      {currentMood === 'angry' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(255,0,0,0.15) 0%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* CONFUSED Wobbling Question Marks */}
      {currentMood === 'confused' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${20 + (i * 12)}%`,
                left: `${15 + (i * 14)}%`,
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 'bold',
                fontSize: `${24 + (i % 3) * 6}px`,
                animation: `float-zzz ${3 + (i % 2)}s infinite ease-in-out`,
                animationDelay: `${i * 0.4}s`,
                transform: `rotate(${(i % 2 === 0 ? 1 : -1) * 15}deg)`,
              }}
            >
              ?
            </div>
          ))}
        </div>
      )}

      {/* TODDLER Bubbles / Stars */}
      {currentMood === 'toddler' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: '-20px',
                left: `${10 + (i * 9)}%`,
                width: `${10 + (i % 4) * 4}px`,
                height: `${10 + (i % 4) * 4}px`,
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
                animation: 'rain-fall 4s infinite linear reverse',
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* OVERPROTECTIVE Shield/Heart Pulse */}
      {currentMood === 'overprotective' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(163, 203, 164, 0.2) 0%, rgba(201, 228, 202, 0.4) 100%)',
            pointerEvents: 'none',
            animation: 'pulse-breath 3s infinite ease-in-out',
          }}
        />
      )}

      {/* BARGAINER Coins/Stars */}
      {currentMood === 'bargainer' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${15 + (i * 12)}%`,
                left: `${80 - (i * 10)}%`,
                color: '#FFD700',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 'bold',
                fontSize: `${20 + (i % 2) * 5}px`,
                animation: `float-zzz ${2.5 + (i % 2)}s infinite ease-in-out`,
                animationDelay: `${i * 0.3}s`,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              ★
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

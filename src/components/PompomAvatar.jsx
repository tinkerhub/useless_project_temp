import React from 'react';

export default function PompomAvatar({ mood, intensity, isThinking = false, isError = false }) {
  const activeMood = isError ? 'sleepy' : mood || 'excited';

  let animClass = `anim-${activeMood}`;
  if (isThinking) animClass = 'anim-shy';
  if (isError) animClass = 'anim-angry';

  return (
    <div
      style={{
        position: 'relative',
        width: '220px',
        height: '220px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
      className={animClass}
    >
      <svg
        viewBox="0 0 240 240"
        width="100%"
        height="100%"
        style={{
          filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.15))',
          transition: 'transform 0.5s ease-out',
        }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4F0FF" />
            <stop offset="100%" stopColor="#BCE7FD" />
          </linearGradient>
          <linearGradient id="blushGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB3C6" />
            <stop offset="100%" stopColor="#FF85A1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* EARS */}
        {/* Left Ear */}
        <path
          d={
            activeMood === 'excited'
              ? "M 55 90 C 30 20, 60 -10, 85 65 Z"
              : activeMood === 'sad' || activeMood === 'sleepy' || activeMood === 'confused'
              ? "M 60 100 C 10 140, 20 180, 50 130 Z"
              : activeMood === 'angry' || activeMood === 'overprotective'
              ? "M 55 95 C 10 70, 30 20, 80 75 Z"
              : activeMood === 'shy'
              ? "M 60 100 C 35 60, 50 40, 75 80 Z"
              : activeMood === 'toddler'
              ? "M 55 95 C 20 40, 60 20, 85 75 Z" // shorter rounder
              : "M 55 90 C 25 30, 60 10, 80 70 Z" // dramatic, bargainer & default
          }
          fill="url(#bodyGrad)"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Left Ear Inner */}
        <path
          d={
            activeMood === 'excited'
              ? "M 60 85 C 40 30, 60 10, 80 65 Z"
              : activeMood === 'sad' || activeMood === 'sleepy' || activeMood === 'confused'
              ? "M 58 105 C 20 140, 30 170, 50 125 Z"
              : activeMood === 'toddler'
              ? "M 60 95 C 40 50, 60 40, 80 75 Z"
              : "M 60 90 C 35 40, 55 25, 75 70 Z"
          }
          fill="#FFA6C1"
          opacity="0.6"
        />

        {/* Right Ear */}
        <path
          d={
            activeMood === 'excited'
              ? "M 185 90 C 210 20, 180 -10, 155 65 Z"
              : activeMood === 'sad' || activeMood === 'sleepy'
              ? "M 180 100 C 230 140, 220 180, 190 130 Z"
              : activeMood === 'angry' || activeMood === 'overprotective'
              ? "M 185 95 C 230 70, 210 20, 160 75 Z"
              : activeMood === 'shy'
              ? "M 180 100 C 205 60, 190 40, 165 80 Z"
              : activeMood === 'toddler'
              ? "M 185 95 C 220 40, 180 20, 155 75 Z" // shorter rounder
              : "M 185 90 C 215 30, 180 10, 160 70 Z" // confused (up), dramatic, bargainer
          }
          fill="url(#bodyGrad)"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Right Ear Inner */}
        <path
          d={
            activeMood === 'excited'
              ? "M 180 85 C 200 30, 180 10, 160 65 Z"
              : activeMood === 'sad' || activeMood === 'sleepy'
              ? "M 182 105 C 220 140, 210 170, 190 125 Z"
              : activeMood === 'toddler'
              ? "M 180 95 C 200 50, 180 40, 160 75 Z"
              : "M 180 90 C 205 40, 185 25, 165 70 Z"
          }
          fill="#FFA6C1"
          opacity="0.6"
        />

        {/* MAIN BODY (Fluffy Chibi Bunny-Cat) */}
        <ellipse
          cx="120"
          cy="135"
          rx={activeMood === 'sleepy' ? '85' : activeMood === 'toddler' ? '80' : '75'}
          ry={activeMood === 'sleepy' ? '55' : activeMood === 'toddler' ? '75' : '65'}
          fill="url(#bodyGrad)"
          stroke="#FFFFFF"
          strokeWidth="6"
        />

        {/* CHEEK BLUSH */}
        <ellipse cx="70" cy="145" rx="14" ry="9" fill="url(#blushGrad)" opacity={activeMood === 'shy' ? '0.9' : '0.55'} />
        <ellipse cx="170" cy="145" rx="14" ry="9" fill="url(#blushGrad)" opacity={activeMood === 'shy' ? '0.9' : '0.55'} />

        {/* EYES */}
        {isError ? (
          // Spiral Error Eyes
          <g stroke="#1A1A2E" strokeWidth="3" fill="none">
            <path d="M 80 125 A 8 8 0 1 1 95 125 A 4 4 0 1 1 88 125" />
            <path d="M 145 125 A 8 8 0 1 1 160 125 A 4 4 0 1 1 153 125" />
          </g>
        ) : activeMood === 'excited' ? (
          // Star Eyes
          <g fill="#FFD166" stroke="#1A1A2E" strokeWidth="2">
            <path d="M 85 115 L 88 123 L 96 123 L 90 128 L 92 136 L 85 131 L 78 136 L 80 128 L 74 123 L 82 123 Z" />
            <path d="M 155 115 L 158 123 L 166 123 L 160 128 L 162 136 L 155 131 L 148 136 L 150 128 L 144 123 L 152 123 Z" />
          </g>
        ) : activeMood === 'angry' ? (
          // Scowling Eyes
          <g fill="#1A1A2E">
            <path d="M 70 115 L 100 125 L 75 132 Z" />
            <path d="M 170 115 L 140 125 L 165 132 Z" />
          </g>
        ) : activeMood === 'sleepy' ? (
          // Slit Eyes (- -)
          <g stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round">
            <line x1="72" y1="128" x2="98" y2="128" />
            <line x1="142" y1="128" x2="168" y2="128" />
          </g>
        ) : activeMood === 'sad' ? (
          // Teary Glassy Eyes
          <g>
            <circle cx="85" cy="125" r="12" fill="#1A1A2E" />
            <circle cx="155" cy="125" r="12" fill="#1A1A2E" />
            <circle cx="81" cy="121" r="5" fill="#FFFFFF" />
            <circle cx="151" cy="121" r="5" fill="#FFFFFF" />
            {/* Tear drop */}
            <path d="M 68 130 C 65 145, 75 145, 75 135 Z" fill="#8ECAE6" opacity="0.8" />
          </g>
        ) : activeMood === 'shy' ? (
          // Side glancing teary eyes
          <g>
            <circle cx="85" cy="125" r="11" fill="#1A1A2E" />
            <circle cx="155" cy="125" r="11" fill="#1A1A2E" />
            <circle cx="88" cy="122" r="4" fill="#FFFFFF" />
            <circle cx="158" cy="122" r="4" fill="#FFFFFF" />
          </g>
        ) : activeMood === 'confused' ? (
          // Cross-eyed / pupils different
          <g>
            <circle cx="85" cy="125" r="13" fill="#FFFFFF" stroke="#1A1A2E" strokeWidth="2" />
            <circle cx="155" cy="125" r="13" fill="#FFFFFF" stroke="#1A1A2E" strokeWidth="2" />
            <circle cx="92" cy="125" r="5" fill="#1A1A2E" /> {/* pointing right */}
            <circle cx="148" cy="120" r="5" fill="#1A1A2E" /> {/* pointing left and up */}
          </g>
        ) : activeMood === 'toddler' ? (
          // Huge sparkly eyes
          <g>
            <circle cx="85" cy="130" r="18" fill="#1A1A2E" />
            <circle cx="155" cy="130" r="18" fill="#1A1A2E" />
            <circle cx="79" cy="124" r="8" fill="#FFFFFF" />
            <circle cx="149" cy="124" r="8" fill="#FFFFFF" />
            <circle cx="92" cy="134" r="4" fill="#FFFFFF" />
            <circle cx="162" cy="134" r="4" fill="#FFFFFF" />
            <path d="M 75 140 L 80 135 L 85 140 Z" fill="#FFD166" />
            <path d="M 145 140 L 150 135 L 155 140 Z" fill="#FFD166" />
          </g>
        ) : activeMood === 'bargainer' ? (
          // Sly squinting eyes
          <g fill="#1A1A2E">
            <path d="M 70 125 Q 85 115 100 125 Q 85 130 70 125 Z" />
            <path d="M 170 125 Q 155 115 140 125 Q 155 130 170 125 Z" />
            <circle cx="85" cy="124" r="4" fill="#FFFFFF" />
            <circle cx="155" cy="124" r="4" fill="#FFFFFF" />
          </g>
        ) : (
          // Dramatic / Overprotective / Default Big Shiny Eyes
          <g>
            <circle cx="85" cy="125" r="13" fill="#1A1A2E" />
            <circle cx="155" cy="125" r="13" fill="#1A1A2E" />
            <circle cx="81" cy="120" r="6" fill="#FFFFFF" />
            <circle cx="151" cy="120" r="6" fill="#FFFFFF" />
            <circle cx="89" cy="129" r="2.5" fill="#FFFFFF" />
            <circle cx="159" cy="129" r="2.5" fill="#FFFFFF" />
          </g>
        )}

        {/* EYEBROWS */}
        {(activeMood === 'angry' || activeMood === 'overprotective') && (
          <g stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round">
            <line x1="70" y1="108" x2="98" y2="118" />
            <line x1="170" y1="108" x2="142" y2="118" />
          </g>
        )}
        {activeMood === 'sad' && (
          <g stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round">
            <line x1="72" y1="112" x2="95" y2="106" />
            <line x1="168" y1="112" x2="145" y2="106" />
          </g>
        )}
        {activeMood === 'bargainer' && (
          <g stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round">
            {/* Raised eyebrow on one side */}
            <path d="M 70 110 Q 85 100 100 110" fill="none" />
            <line x1="140" y1="115" x2="170" y2="110" />
          </g>
        )}

        {/* MOUTH */}
        {isError ? (
          <path d="M 105 152 Q 120 142 135 152" fill="none" stroke="#1A1A2E" strokeWidth="4" strokeLinecap="round" />
        ) : activeMood === 'excited' || activeMood === 'toddler' ? (
          // Wide smile :D
          <path d="M 102 142 Q 120 165 138 142 Z" fill="#FF6B6B" stroke="#1A1A2E" strokeWidth="3" />
        ) : activeMood === 'angry' ? (
          // Zig-zag teeth
          <path d="M 100 148 L 108 142 L 116 148 L 124 142 L 132 148 L 140 142" fill="none" stroke="#1A1A2E" strokeWidth="3.5" strokeLinecap="round" />
        ) : activeMood === 'sad' || activeMood === 'overprotective' ? (
          // Wavy frown
          <path d="M 104 150 Q 120 140 136 150" fill="none" stroke="#1A1A2E" strokeWidth="3.5" strokeLinecap="round" />
        ) : activeMood === 'sleepy' ? (
          // Small 'o' yawn mouth with drool bubble
          <g>
            <ellipse cx="120" cy="148" rx="6" ry="8" fill="#1A1A2E" />
            {/* Drool bubble */}
            <circle cx="128" cy="154" r="5" fill="#BCE7FD" opacity="0.85" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        ) : activeMood === 'shy' ? (
          // Small timid mouth
          <path d="M 112 145 Q 120 149 128 145" fill="none" stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round" />
        ) : activeMood === 'confused' ? (
          // Wavy confusion mouth
          <path d="M 105 145 Q 112 140 120 145 T 135 145" fill="none" stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round" />
        ) : activeMood === 'bargainer' ? (
          // Smirk
          <path d="M 110 145 Q 125 155 135 140" fill="none" stroke="#1A1A2E" strokeWidth="3" strokeLinecap="round" />
        ) : (
          // Dramatic open mouth
          <ellipse cx="120" cy="148" rx="8" ry="10" fill="#FF85A1" stroke="#1A1A2E" strokeWidth="3" />
        )}

        {/* PAWS */}
        {activeMood === 'shy' ? (
          // Paws covering mouth
          <g>
            <ellipse cx="102" cy="148" rx="10" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
            <ellipse cx="138" cy="148" rx="10" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
          </g>
        ) : activeMood === 'excited' || activeMood === 'toddler' ? (
          // Paws raised high
          <g>
            <ellipse cx="65" cy="130" rx="10" ry="12" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
            <ellipse cx="175" cy="130" rx="10" ry="12" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
          </g>
        ) : activeMood === 'overprotective' ? (
          // Blocking defensive paws
          <g>
            <ellipse cx="75" cy="145" rx="12" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" transform="rotate(-30 75 145)" />
            <ellipse cx="165" cy="145" rx="12" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" transform="rotate(30 165 145)" />
          </g>
        ) : activeMood === 'bargainer' ? (
          // One paw extended forward
          <g>
            <ellipse cx="90" cy="165" rx="11" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
            <ellipse cx="160" cy="150" rx="13" ry="9" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" transform="rotate(15 160 150)" />
          </g>
        ) : (
          // Standard paws on belly
          <g>
            <ellipse cx="90" cy="165" rx="11" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
            <ellipse cx="150" cy="165" rx="11" ry="8" fill="url(#bodyGrad)" stroke="#FFFFFF" strokeWidth="3" />
          </g>
        )}

        {/* STEAM PUFFS NEAR EARS FOR ANGRY */}
        {activeMood === 'angry' && (
          <g fill="#FFFFFF" opacity="0.8">
            <circle cx="45" cy="65" r="8" />
            <circle cx="35" cy="60" r="5" />
            <circle cx="195" cy="65" r="8" />
            <circle cx="205" cy="60" r="5" />
          </g>
        )}

        {/* OVERPROTECTIVE SHIELD ICON */}
        {activeMood === 'overprotective' && (
          <g transform="translate(110, 160) scale(0.6)">
            <path d="M16 2 L4 6 L4 14 C4 20 9.5 25 16 28 C22.5 25 28 20 28 14 L28 6 Z" fill="#FFF" opacity="0.9" />
            <path d="M16 9 C14 7 10 9 10 12 C10 16 16 20 16 20 C16 20 22 16 22 12 C22 9 18 7 16 9 Z" fill="#FF6B6B" />
          </g>
        )}

      </svg>
    </div>
  );
}

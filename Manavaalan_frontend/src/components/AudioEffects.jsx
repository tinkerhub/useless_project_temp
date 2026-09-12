import React, { useEffect, useRef } from 'react';

export function AudioEffects({ page, audioEnabled }) {
  const audioContextRef = useRef(null);

  // Play subtle web audio synthesizer bleeps / transitions when pages change
  useEffect(() => {
    if (!audioEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = page === 3 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(page * 220 + 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(page * 300 + 300, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Ignore web audio policy restrictions if un-acted by user
    }
  }, [page, audioEnabled]);

  return null;
}

import React, { useRef, useEffect } from 'react';
import { LocationItem } from '../../types';
import { Compass, Crosshair, Navigation } from 'lucide-react';

interface LocalSectorViewProps {
  location: LocationItem | null;
  bearing: number;
  bearingCompass: string;
  visible: boolean;
  transitionProgress: number; // 0 = fully 2D 80km, 1 = zoomed out
}

export const LocalSectorView: React.FC<LocalSectorViewProps> = ({
  location,
  bearing,
  bearingCompass,
  visible,
  transitionProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Preload earth satellite texture for sector map crop
  useEffect(() => {
    const img = new Image();
    img.src = '/textures/earth_atmos_2048.jpg';
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);

  useEffect(() => {
    if (!visible || !location || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let startTime = performance.now();

    const draw = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const elapsed = (now - startTime) / 1000;

      ctx.clearRect(0, 0, w, h);

      // 1. Dark high-contrast background
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, w, h);

      // 2. Render 80km x 80km Earth Texture Crop
      // Earth circumference is ~40,075 km -> 1 deg lat ≈ 111.32 km.
      // 80 km sector corresponds to ~0.7186° lat and ~0.7186° / cos(lat) lon.
      const lat = location.coords.lat;
      const lng = location.coords.lng;
      const degSpanLat = 80 / 111.32; // ~0.7186°
      const cosLat = Math.max(0.15, Math.cos((lat * Math.PI) / 180));
      const degSpanLng = degSpanLat / cosLat;

      if (imageRef.current && imageRef.current.complete) {
        ctx.save();
        // Convert geographic bounds to image pixel UV coordinates
        const imgW = imageRef.current.naturalWidth || 2048;
        const imgH = imageRef.current.naturalHeight || 1024;

        const uMin = ((lng - degSpanLng / 2 + 180) / 360) * imgW;
        const uMax = ((lng + degSpanLng / 2 + 180) / 360) * imgW;
        const vMin = ((90 - (lat + degSpanLat / 2)) / 180) * imgH;
        const vMax = ((90 - (lat - degSpanLat / 2)) / 180) * imgH;

        const cropW = Math.max(1, uMax - uMin);
        const cropH = Math.max(1, vMax - vMin);

        // High-contrast stark black & white filter
        ctx.filter = 'grayscale(100%) contrast(220%) brightness(140%)';
        ctx.drawImage(
          imageRef.current,
          Math.max(0, uMin),
          Math.max(0, vMin),
          Math.min(imgW, cropW),
          Math.min(imgH, cropH),
          0,
          0,
          w,
          h
        );
        ctx.restore();
      }

      // 3. Tactical Grid Overlay (10 km divisions = 8 subdivisions)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      const gridCount = 8;
      for (let i = 1; i < gridCount; i++) {
        const x = (w / gridCount) * i;
        const y = (h / gridCount) * i;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Concentric 20km, 40km, 60km, 80km Range Rings
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(w, h) * 0.44;

      [0.25, 0.5, 0.75, 1.0].forEach((ratio, idx) => {
        const r = maxRadius * ratio;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.16)';
        ctx.setLineDash(idx === 3 ? [] : [4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring distance labels (20km, 40km, 60km, 80km)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${(idx + 1) * 20} km`, cx + 6, cy - r + 14);
      });

      // Rotating radar sweep beam
      const sweepAngle = (elapsed * 1.8) % (Math.PI * 2);
      ctx.save();
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Departure Azimuth Vector Arrow
      const radBearing = ((bearing - 90) * Math.PI) / 180;
      const arrowLen = maxRadius * 0.92;
      const targetX = cx + Math.cos(radBearing) * arrowLen;
      const targetY = cy + Math.sin(radBearing) * arrowLen;

      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Arrowhead
      const headAngle = Math.atan2(targetY - cy, targetX - cx);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(
        targetX - 16 * Math.cos(headAngle - Math.PI / 7),
        targetY - 16 * Math.sin(headAngle - Math.PI / 7)
      );
      ctx.lineTo(
        targetX - 16 * Math.cos(headAngle + Math.PI / 7),
        targetY - 16 * Math.sin(headAngle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Center Origin Pin / Reticle
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing beacon ring
      const pulseR = 8 + (Math.sin(elapsed * 6) + 1) * 6;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      animFrame = requestAnimationFrame(draw);
    };

    animFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame);
  }, [visible, location, bearing]);

  if (!visible || !location) return null;

  // Scale and opacity during zoom-out transition
  const scale = 1 + transitionProgress * 2.5;
  const opacity = Math.max(0, 1 - transitionProgress * 1.2);

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-300"
      style={{
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="relative w-full h-full max-w-4xl max-h-[85vh] p-4 flex flex-col items-center justify-center">
        {/* Radar / Tactical 2D Canvas */}
        <div className="relative w-full aspect-square max-w-[650px] rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-space-950">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            className="w-full h-full object-cover"
          />

          {/* Tactical Corner Brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />

          {/* Top Header HUD Badge */}
          <div className="absolute top-5 left-8 right-8 flex items-center justify-between pointer-events-auto">
            <div className="glass-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                80 km × 80 km Local Tactical Display
              </span>
            </div>
            <div className="glass-panel px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[11px] text-slate-300">
              SCALE: 1:80,000 m
            </div>
          </div>

          {/* Center Coordinates & Location HUD Tag */}
          <div className="absolute top-[54%] left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-xl border border-cyan-500/40 text-center shadow-xl">
            <p className="text-xs font-bold text-white tracking-wide truncate max-w-xs">
              {location.name}
            </p>
            <p className="text-[10px] font-mono text-cyan-400">
              {location.coords.lat.toFixed(4)}°N, {location.coords.lng.toFixed(4)}°E
            </p>
          </div>

          {/* Bottom Bar: Scale Bar & Departure Bearing Vector */}
          <div className="absolute bottom-5 left-8 right-8 flex items-center justify-between">
            <div className="glass-panel px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Navigation size={14} className="text-cyan-400" />
              <div className="font-mono text-xs">
                <span className="text-slate-400">DEPARTURE AZIMUTH: </span>
                <span className="text-cyan-300 font-bold">
                  {bearingCompass} {bearing}°
                </span>
              </div>
            </div>

            {/* Visual 80 km Scale Bar */}
            <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center">
              <div className="w-28 h-1.5 border-b-2 border-l-2 border-r-2 border-white/80 relative" />
              <span className="font-mono text-[10px] text-slate-300 tracking-wider mt-1">
                80 km Sector
              </span>
            </div>
          </div>
        </div>

        {/* Cinematic status message */}
        <div className="mt-3 text-center">
          <p className="font-mono text-xs text-cyan-400 tracking-widest uppercase flex items-center justify-center gap-2">
            <Crosshair size={14} className="animate-spin" />
            Locking Departure Coordinates // Calibrating Global Geodesic Vector...
          </p>
        </div>
      </div>
    </div>
  );
};

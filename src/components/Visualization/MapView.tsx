import React, { useRef, useEffect } from 'react';
import { Coordinates, RouteData } from '../../types';

interface MapViewProps {
  routeData: RouteData | null;
  drawProgress: number; // 0 to 1
  onCursorMove?: (coords: Coordinates) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  routeData,
  drawProgress,
  onCursorMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Preload earth texture for 2D background
  useEffect(() => {
    const img = new Image();
    img.src = '/textures/earth_atmos_2048.jpg';
    img.onload = () => {
      imageRef.current = img;
      render();
    };
  }, []);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background deep space
    ctx.fillStyle = '#05080e';
    ctx.fillRect(0, 0, width, height);

    // Render Earth map in grayscale
    if (imageRef.current) {
      ctx.save();
      // Apply grayscale filter
      ctx.filter = 'grayscale(100%) brightness(0.6) contrast(1.2)';
      ctx.drawImage(imageRef.current, 0, 0, width, height);
      ctx.restore();

      // Subtle cool blue tint overlay
      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw Graticule lines (Latitude & Longitude grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;

    // Longitude lines (every 30°)
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Latitude lines (every 30°)
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Prime meridian highlight
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    if (!routeData) return;

    const coords = routeData.coordinates;
    if (coords.length < 2) return;

    const pointsToDraw = Math.floor(coords.length * Math.min(1, Math.max(0, drawProgress)));
    if (pointsToDraw < 2) return;

    // Helper to convert (lat, lng) to canvas pixels
    const toCanvasPoint = (c: Coordinates) => ({
      x: ((c.lng + 180) / 360) * width,
      y: ((90 - c.lat) / 180) * height,
    });

    // Draw glowing route path with antimeridian (±180°) split handling
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    let isDrawing = false;

    for (let i = 0; i < pointsToDraw; i++) {
      const p = toCanvasPoint(coords[i]);

      if (i === 0) {
        ctx.moveTo(p.x, p.y);
        isDrawing = true;
      } else {
        const prev = coords[i - 1];
        const curr = coords[i];

        // Check if segment crosses the antimeridian (jump > 180°)
        if (Math.abs(curr.lng - prev.lng) > 180) {
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw active tip particle
    if (pointsToDraw > 0 && pointsToDraw < coords.length) {
      const tip = toCanvasPoint(coords[pointsToDraw - 1]);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Start Marker (Emerald Green)
    const startPt = toCanvasPoint(coords[0]);
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Destination Marker (Rose Red)
    if (drawProgress >= 0.95 || routeData) {
      const endPt = toCanvasPoint(coords[coords.length - 1]);
      ctx.save();
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      render();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [routeData, drawProgress]);

  useEffect(() => {
    render();
  }, [routeData, drawProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCursorMove || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lng = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;
    onCursorMove({ lat, lng });
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-space-950 overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="w-full h-full cursor-crosshair"
      />
      {/* 2D Planar Mode Badge */}
      <div className="absolute top-20 right-4 glass-panel px-3 py-1.5 rounded-xl text-[11px] font-mono text-cyan-300 pointer-events-none">
        Projection: Equirectangular 2D
      </div>
    </div>
  );
};

import React from 'react';
import { Coordinates } from '../../types';

interface BottomStatusBarProps {
  cursorCoords: Coordinates | null;
  cameraAltKm: number;
  elevationMeters?: number;
  headingDegrees: number;
}

function formatDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"${direction}`;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  cursorCoords,
  cameraAltKm,
  elevationMeters = 12,
  headingDegrees,
}) => {
  const displayCoords = cursorCoords || { lat: 0, lng: 0 };

  return (
    <footer className="h-7 w-full bg-space-950/80 backdrop-blur-md border-t border-white/10 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none pointer-events-none z-20">
      {/* Left side: Imagery & geodesic notes */}
      <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="hidden sm:inline text-slate-500">
          Geodesic Arc: <strong className="text-slate-300 font-medium">WGS-84 Complementary</strong>
        </span>
        <span className="hidden md:inline text-slate-600">|</span>
        <span className="text-slate-500">
          Data: <span className="text-slate-400">OpenStreetMap</span>
        </span>
      </div>

      {/* Right side: Real-time telemetry */}
      <div className="flex items-center gap-3 md:gap-5 whitespace-nowrap font-mono tracking-tight text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 hidden xs:inline">Coord:</span>
          <span className="text-cyan-400">
            {formatDMS(displayCoords.lat, true)} {formatDMS(displayCoords.lng, false)}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <span className="text-slate-500">elev:</span>
          <span>{elevationMeters} m</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">Eye alt:</span>
          <span className="text-slate-200 font-semibold">
            {cameraAltKm >= 1000
              ? `${Math.round(cameraAltKm).toLocaleString()} km`
              : `${cameraAltKm.toFixed(1)} km`}
          </span>
        </div>
      </div>
    </footer>
  );
};

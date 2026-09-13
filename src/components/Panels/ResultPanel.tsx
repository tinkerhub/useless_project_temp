import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Share2,
  Check,
  Compass,
  Plane,
  Footprints,
  Info,
} from 'lucide-react';
import { RouteData } from '../../types';
import { formatDistance } from '../../utils/geo';

interface ResultPanelProps {
  routeData: RouteData | null;
  onClose: () => void;
  onReplayAnimation: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  routeData,
  onClose,
  onReplayAnimation,
}) => {
  const [copied, setCopied] = useState(false);

  if (!routeData) return null;

  const { from, to, telemetry } = routeData;

  const handleCopyDetails = () => {
    const text = `AeroRoute Global Trajectory Report:
Departure: ${from.name}
Destination: ${to.name}
Calculated Flight Distance: ${formatDistance(telemetry.longWayDistanceKm)}
Departure Azimuth: ${telemetry.longWayBearingCompass} (${telemetry.longWayBearing}°)
Direct Reference Distance: ${formatDistance(telemetry.shortestDistanceKm)}
Estimated Flight Time: ${telemetry.longWayFlyingHours.toLocaleString()} hours`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="absolute bottom-10 left-4 right-4 md:left-auto md:right-4 md:bottom-12 md:w-96 z-30 pointer-events-auto">
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Flight Trajectory Summary
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyDetails}
              title="Copy trajectory telemetry"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Main Trajectory Distance Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/50 to-space-900 border border-cyan-500/20 text-center">
            <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300">
              Total Calculated Distance
            </span>
            <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-cyan-400 font-mono tracking-tight my-1">
              {formatDistance(telemetry.longWayDistanceKm)}
            </div>
            <p className="text-[11px] text-slate-300">
              Continuous Geodesic Surface Track
            </p>
          </div>

          {/* Comparison Cards: Calculated Trajectory vs Direct Reference */}
          <div className="space-y-2 font-mono text-xs">
            {/* Calculated Trajectory Card */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-cyan-200 font-sans font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Calculated Trajectory
                </span>
                <span className="text-cyan-400 font-semibold text-sm">
                  {formatDistance(telemetry.longWayDistanceKm)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-cyan-500/10">
                <span className="flex items-center gap-1">
                  <Compass size={12} className="text-cyan-400/70" />
                  Departure Azimuth
                </span>
                <span className="text-cyan-200 font-medium">
                  {telemetry.longWayBearingCompass} {telemetry.longWayBearing}°
                </span>
              </div>
            </div>

            {/* Direct Reference Card */}
            <div className="p-3 rounded-xl bg-space-950/60 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Direct Line Reference
                </span>
                <span className="text-emerald-400 font-semibold">
                  {formatDistance(telemetry.shortestDistanceKm)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <Compass size={12} className="text-slate-500" />
                  Direct Heading
                </span>
                <span className="text-slate-200">
                  {telemetry.shortestBearingCompass} {telemetry.shortestBearing}°
                </span>
              </div>
            </div>
          </div>

          {/* Travel time estimates */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-space-950/40 border border-white/5 flex items-center gap-2">
              <Plane size={16} className="text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Flight Time</span>
                <span className="text-slate-200 font-medium">
                  ~{telemetry.longWayFlyingHours.toLocaleString()} hrs
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-space-950/40 border border-white/5 flex items-center gap-2">
              <Footprints size={16} className="text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Surface Transit</span>
                <span className="text-slate-200 font-medium">
                  ~{telemetry.longWayWalkingDays.toLocaleString()} days
                </span>
              </div>
            </div>
          </div>

          {/* Technical Telemetry Note */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] leading-relaxed text-slate-300 flex items-start gap-2">
            <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Flight path computed from {from.shortName || from.name} to {to.shortName || to.name} across 400 orthodromic waypoints on the WGS-84 reference ellipsoid.
            </p>
          </div>

          {/* Replay Button */}
          <button
            onClick={onReplayAnimation}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RotateCcw size={14} />
            Replay Trajectory Scan
          </button>
        </div>
      </div>
    </div>
  );
};

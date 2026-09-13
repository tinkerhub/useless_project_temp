import React from 'react';
import { RouteData, PresetRoute } from '../../types';
import { EARTH_CIRCUMFERENCE_KM, formatDistance } from '../../utils/geo';
import { PRESET_ROUTES } from '../../services/presets';
import { Sparkles, Globe, ArrowRight } from 'lucide-react';

interface DashboardStatsProps {
  routeData: RouteData | null;
  onSelectPreset: (preset: PresetRoute) => void;
  visible: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  routeData,
  onSelectPreset,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute top-20 right-4 z-20 hidden lg:flex flex-col gap-3 max-w-sm pointer-events-none">
      {/* Planetary Metrics Card */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Globe size={13} className="text-cyan-400" />
            Global Geodesic Metrics
          </span>
          <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20">
            WGS-84
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-space-950/50 border border-white/5">
            <span className="text-slate-500 text-[10px] block uppercase">Circumference</span>
            <span className="text-slate-200 font-semibold">{EARTH_CIRCUMFERENCE_KM.toLocaleString()} km</span>
          </div>

          <div className="p-2.5 rounded-xl bg-space-950/50 border border-white/5">
            <span className="text-slate-500 text-[10px] block uppercase">Mean Radius</span>
            <span className="text-slate-200 font-semibold">6,378.1 km</span>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
            <span className="text-cyan-400/70 text-[10px] block uppercase">Trajectory Track</span>
            <span className="text-cyan-300 font-bold text-sm">
              {routeData ? `${formatDistance(routeData.telemetry.longWayDistanceKm)}` : '40,000+ km'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
            <span className="text-cyan-400/70 text-[10px] block uppercase">Direct Vector</span>
            <span className="text-cyan-300 font-bold text-sm">
              {routeData ? `${formatDistance(routeData.telemetry.shortestDistanceKm)}` : 'Reference Arc'}
            </span>
          </div>
        </div>
      </div>

      {/* Saved Routes Card */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles size={12} className="text-cyan-400" />
            Saved Routes
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1-Click</span>
        </div>

        <div className="space-y-1.5">
          {PRESET_ROUTES.slice(0, 3).map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="w-full text-left p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between group"
            >
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                  {preset.title}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {preset.standardDistanceKm} km → <span className="text-cyan-400">{preset.longDistanceKm.toLocaleString()} km</span>
                </p>
              </div>
              <ArrowRight size={13} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

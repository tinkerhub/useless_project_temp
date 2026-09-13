import React from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { PRESET_ROUTES } from '../../services/presets';
import { PresetRoute } from '../../types';
import { formatDistance } from '../../utils/geo';

interface PresetRoutesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetRoute) => void;
}

export const PresetRoutes: React.FC<PresetRoutesProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Featured Flight Corridors</h2>
              <p className="text-xs text-slate-400">Curated global geodesic trajectories spanning worldwide waypoints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {PRESET_ROUTES.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="glass-panel p-4 rounded-xl border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {preset.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">{preset.description}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                  {formatDistance(preset.longDistanceKm)}
                </span>
              </div>

              {/* Comparison stats row */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono my-2.5 bg-space-950/40 p-2.5 rounded-lg border border-white/5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Direct Reference</span>
                  <span className="text-emerald-400 font-semibold">{preset.standardDistanceKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Calculated Flight Track</span>
                  <span className="text-cyan-400 font-semibold">{preset.longDistanceKm.toLocaleString()} km</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="truncate italic text-slate-400/90">{preset.highlight}</span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium shrink-0 ml-2">
                  Select <ArrowRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

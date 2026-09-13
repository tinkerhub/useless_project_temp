import React from 'react';
import { Globe2, Map, Sparkles, HelpCircle, Navigation, Home } from 'lucide-react';

interface HeaderHUDProps {
  is3D: boolean;
  onToggleView: () => void;
  onOpenPresets: () => void;
  onOpenAbout: () => void;
  onReturnToLanding: () => void;
  hasActiveRoute: boolean;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  is3D,
  onToggleView,
  onOpenPresets,
  onOpenAbout,
  onReturnToLanding,
  hasActiveRoute,
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-30">
      {/* Brand & Title (Clean Aerospace / Precision Flight aesthetic) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onReturnToLanding}
          className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl border border-white/10 hover:border-cyan-500/30 transition-all text-left group"
          title="Return to System Overview Deck"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-sm group-hover:scale-105 transition-transform">
            <Navigation size={18} className="rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                AeroRoute Global
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden xs:block">
              Precision Geodesic Flight System
            </p>
          </div>
        </button>
      </div>

      {/* Top right quick actions */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onReturnToLanding}
          className="glass-panel px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
          title="Return to System Deck"
        >
          <Home size={14} className="text-cyan-400" />
          <span className="hidden sm:inline">Deck</span>
        </button>

        <button
          onClick={onOpenPresets}
          className="glass-panel px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
          title="Explore Featured Flight Corridors"
        >
          <Sparkles size={14} className="text-cyan-400" />
          <span className="hidden sm:inline">Featured Routes</span>
          <span className="sm:hidden">Routes</span>
        </button>

        <button
          onClick={onToggleView}
          className="glass-panel px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-cyan-300 hover:border-cyan-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-lg"
          title="Toggle between 3D Globe and 2D Flat Map"
        >
          {is3D ? <Map size={14} className="text-cyan-400" /> : <Globe2 size={14} className="text-cyan-400" />}
          <span className="hidden sm:inline">{is3D ? '2D Map' : '3D Globe'}</span>
        </button>

        <button
          onClick={onOpenAbout}
          className="glass-panel p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:border-cyan-500/30 transition-all active:scale-95 shadow-lg"
          title="About Geodesic Mathematics"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};

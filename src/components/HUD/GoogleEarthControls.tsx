import React from 'react';
import { Compass, Plus, Minus, RotateCcw, Box, Maximize2, Minimize2 } from 'lucide-react';

interface GoogleEarthControlsProps {
  heading: number; // Camera heading in degrees (0 = North)
  tilt: number; // Camera tilt in degrees
  is3D: boolean;
  onResetNorth: () => void;
  onToggle3D: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const GoogleEarthControls: React.FC<GoogleEarthControlsProps> = ({
  heading,
  tilt,
  is3D,
  onResetNorth,
  onToggle3D,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none pointer-events-auto">
      {/* Compass Needle Gizmo */}
      <button
        onClick={onResetNorth}
        title="Reset North (Click to face North)"
        className="w-11 h-11 rounded-full glass-panel flex items-center justify-center text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-lg active:scale-95 group relative"
      >
        <div
          className="transition-transform duration-200"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* North Red/Cyan Arrow */}
          <div className="w-1.5 h-7 relative flex flex-col items-center">
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[9px] border-b-rose-500" />
            <div className="w-0.5 h-2.5 bg-slate-400" />
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[9px] border-t-slate-400" />
          </div>
        </div>
        <span className="absolute -top-1 font-mono text-[9px] font-bold text-rose-400 tracking-wider">
          N
        </span>
      </button>

      {/* 3D / 2D Toggle */}
      <button
        onClick={onToggle3D}
        title={is3D ? 'Switch to 2D Planar view' : 'Switch to 3D Globe view'}
        className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center font-mono text-xs font-semibold text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-md active:scale-95"
      >
        {is3D ? '3D' : '2D'}
      </button>

      {/* Zoom Controls Stack */}
      <div className="flex flex-col rounded-xl glass-panel overflow-hidden border border-white/10 shadow-lg">
        <button
          onClick={onZoomIn}
          title="Zoom in"
          className="w-10 h-9 flex items-center justify-center text-slate-200 hover:text-cyan-400 hover:bg-white/5 active:scale-95 transition-colors border-b border-white/10"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={onZoomOut}
          title="Zoom out"
          className="w-10 h-9 flex items-center justify-center text-slate-200 hover:text-cyan-400 hover:bg-white/5 active:scale-95 transition-colors"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Reset Camera View */}
      <button
        onClick={onResetView}
        title="Reset Earth View"
        className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-md active:scale-95"
      >
        <RotateCcw size={15} />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-md active:scale-95"
      >
        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      </button>
    </div>
  );
};

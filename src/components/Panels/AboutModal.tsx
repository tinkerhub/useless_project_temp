import React from 'react';
import { X, Globe2, Compass, Cpu, CheckCircle2 } from 'lucide-react';
import { EARTH_CIRCUMFERENCE_KM, EARTH_RADIUS_KM } from '../../utils/geo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Globe2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Geodesic Mathematics</h2>
              <p className="text-xs text-slate-400">Orthodromic Navigation Engine & Spherical Trigonometry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 space-y-1">
            <strong className="block font-medium text-cyan-300 text-sm">
              Great-Circle Navigation Corridors
            </strong>
            <p className="text-[11px] text-cyan-200/80">
              Every two distinct points on a spherical planet define a unique geodesic great circle.
              The flight computer generates a high-density 400-point continuous trajectory across Earth's surface
              utilizing spherical slerp interpolation and unit vector transformation.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-xs uppercase tracking-wider font-mono">
              <Cpu size={14} className="text-cyan-400" />
              Mathematical Source of Truth
            </h3>
            <ul className="space-y-2 font-mono text-[11px] bg-space-950/60 p-3 rounded-xl border border-white/5">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Earth Circumference:</strong> {EARTH_CIRCUMFERENCE_KM.toLocaleString()} km
                  (WGS-84 mean radius: {EARTH_RADIUS_KM.toLocaleString()} km)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Geodesic Resolution:</strong> 400 precision spherical coordinate waypoints
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Trajectory Generation:</strong> 3D Vector Rodrigues rotation & spherical Slerp
                  on the unit sphere, mapped back to precise (lat, lng) waypoints.
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-xs uppercase tracking-wider font-mono">
              <Compass size={14} className="text-cyan-400" />
              Departure Azimuth & Heading
            </h3>
            <p className="text-[11px] text-slate-300">
              The departure azimuth indicates the initial heading angle in degrees (0° North, 90° East, 180° South, 270° West)
              required to begin tracking the calculated global geodesic path.
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Globe2,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { PresetRoute } from '../../types';

interface LandingPageProps {
  onStartNavigation: () => void;
  onSelectPreset?: (preset: PresetRoute) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartNavigation,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white overflow-hidden select-none font-sans flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-white/[0.03] via-transparent to-transparent blur-[100px] rounded-full" />
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Globe icon */}
        <div className="mb-8 w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
          <Globe2 size={28} className="text-white/60" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.1] mb-4">
          The Long Way
          <br />
          <span className="text-white/40">Around</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-md text-center text-sm sm:text-base text-white/35 leading-relaxed mb-12">
          Pick two places on Earth. We'll find the longest possible
          route between them — because why take the short way?
        </p>

        {/* Start button */}
        <button
          onClick={onStartNavigation}
          className="group relative px-10 py-4 rounded-full font-medium text-sm text-black bg-white hover:bg-white/90 transition-all duration-200 flex items-center gap-3 active:scale-[0.97]"
        >
          <MapPin size={16} />
          <span className="font-semibold tracking-wide">Start Exploring</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Tiny fun tag */}
        <p className="mt-6 text-[11px] text-white/20 font-mono tracking-wider">
          a useless project
        </p>
      </div>

      {/* Minimal footer */}
      <footer className="relative z-10 py-6 text-center text-[11px] text-white/15 font-mono tracking-wide">
        the long way around
      </footer>
    </div>
  );
};

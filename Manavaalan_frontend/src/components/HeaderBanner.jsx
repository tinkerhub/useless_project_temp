import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Building2, Volume2, VolumeX, RotateCcw } from 'lucide-react';

export function HeaderBanner({ page, setPage, audioEnabled, setAudioEnabled }) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full bg-[#0a0a0c]/90 backdrop-blur-md border-b border-[#F5A623]/30 px-4 py-3 shadow-2xl flex items-center justify-between"
    >
      {/* Brand Title with Comic Style */}
      <div 
        onClick={() => setPage(1)}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B32025] to-[#F5A623] p-0.5 shadow-lg group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-[#121926] rounded-[7px] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#F5A623] group-hover:rotate-12 transition-transform" />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="font-comic text-3xl md:text-4xl text-[#F5A623] tracking-widest leading-none drop-shadow-[0_4px_10px_rgba(179,32,37,0.8)] border-b-2 border-[#B32025] pb-0.5">
            MANAVALAN<span className="text-[#B32025] text-4xl">.AI</span>
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#F5A623]/80 -mt-0.5">
            Dufay Headquarters • Dubai
          </span>
        </div>
      </div>

      {/* Progress Dots / Steps */}
      <div className="hidden md:flex items-center gap-2 bg-[#121926]/80 px-4 py-1.5 rounded-full border border-[#F5A623]/30">
        {[1, 2, 3, 4, 5].map((step) => (
          <button
            key={step}
            onClick={() => setPage(step)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              page === step
                ? 'bg-[#B32025] text-white shadow-[0_0_12px_rgba(245,166,35,0.6)] scale-105'
                : page > step
                ? 'bg-[#F5A623]/20 text-[#F5A623] hover:bg-[#F5A623]/30'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>P{step}</span>
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          title={audioEnabled ? "Mute audio effects" : "Enable audio effects"}
          className={`p-2 rounded-xl border transition-all ${
            audioEnabled
              ? 'bg-[#B32025]/30 border-[#F5A623] text-[#F5A623] shadow-[0_0_15px_rgba(245,166,35,0.4)]'
              : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {page > 1 && (
          <button
            onClick={() => setPage(1)}
            title="Reset to Page 1"
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:border-[#B32025] hover:text-[#F5A623] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </motion.header>
  );
}

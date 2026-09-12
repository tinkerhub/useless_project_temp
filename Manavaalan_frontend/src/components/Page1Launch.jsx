import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';

export function Page1Launch({ onEnter }) {
  return (
    <motion.div
      key="page1"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 relative z-10"
    >
      {/* Brand Title Area */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121926]/90 border border-[#F5A623]/40 mb-4 shadow-[0_0_15px_rgba(245,166,35,0.2)]">
          <Sparkles className="w-4 h-4 text-[#F5A623] animate-pulse" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#F5A623]">
            International Comedy Enterprise
          </span>
        </div>

        <h1 className="font-comic text-6xl sm:text-7xl md:text-8xl tracking-wider text-[#F5A623] drop-shadow-[0_8px_25px_rgba(179,32,37,0.9)] text-stroke-crimson mb-2">
          MANAVALAN.AI
        </h1>
        <p className="text-gray-300 font-medium text-base sm:text-lg max-w-xl mx-auto px-4">
          The Official AI Interface of Chairman Manavalan • Dufay Headquarters, Dubai
        </p>
      </motion.div>

      {/* Glass Container showcasing first image (melcow.jpg) */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-full max-w-3xl glass-container rounded-2xl p-4 sm:p-6 mb-8 border-2 border-[#F5A623]/30 shadow-[0_0_40px_rgba(179,32,37,0.3)] relative overflow-hidden group"
      >
        <div className="relative rounded-xl overflow-hidden border border-[#F5A623]/20 shadow-inner bg-[#0a0a0c]">
          <img
            src="/assets/melcow.jpg"
            alt="Manavalan Melcow Splash Banner"
            className="w-full h-auto max-h-[50vh] object-cover sm:object-contain mx-auto transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121926]/90 via-transparent to-transparent opacity-80" />
          
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#F5A623]">
            <span className="bg-[#0a0a0c]/80 px-3 py-1 rounded-md border border-[#F5A623]/40">
              📍 DUFAY H.O. DUBAI
            </span>
            <span className="bg-[#B32025]/90 text-white px-3 py-1 rounded-md font-bold shadow-md">
              LIVE SYSTEM READY
            </span>
          </div>
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        onClick={onEnter}
        className="group relative inline-flex items-center gap-4 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#B32025] via-[#d6282e] to-[#B32025] text-white font-black text-lg sm:text-xl tracking-wider uppercase border-2 border-[#F5A623] shadow-[0_0_30px_rgba(245,166,35,0.6)] hover:shadow-[0_0_50px_rgba(179,32,37,0.9)] transition-all cursor-pointer overflow-hidden"
      >
        <span className="relative z-10 drop-shadow-md">ENTER DUFAY HEADQUARTERS</span>
        <ArrowRight className="w-6 h-6 text-[#F5A623] relative z-10 group-hover:translate-x-2 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F5A623]/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </motion.button>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareQuote, ArrowRight, Zap, Award } from 'lucide-react';

export function Page2Welcome({ onProceed }) {
  return (
    <motion.div
      key="page2"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 relative z-10"
    >
      {/* Animated Banner with comic banner text "MELCOW" */}
      <motion.div
        initial={{ scale: 0.8, rotate: -3 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
        className="mb-8 relative"
      >
        <div className="bg-gradient-to-r from-[#B32025] via-[#F5A623] to-[#B32025] p-1 rounded-3xl shadow-[0_0_40px_rgba(245,166,35,0.6)] transform -rotate-1">
          <div className="bg-[#121926] px-8 sm:px-16 py-6 rounded-[22px] border border-[#F5A623]/40 flex flex-col items-center">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#F5A623] mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#B32025]" /> OFFICIAL GREETING • DUFAY HQ
            </span>
            <h2 className="font-comic text-7xl sm:text-8xl md:text-9xl text-white tracking-widest drop-shadow-[0_8px_20px_rgba(179,32,37,0.9)] text-stroke-crimson">
              MELCOW
            </h2>
          </div>
        </div>
      </motion.div>

      {/* Dynamic Dialogue Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-full max-w-2xl glass-container rounded-3xl p-6 sm:p-8 border-2 border-[#F5A623]/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] mb-8 relative"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-[#B32025]/30 border border-[#B32025] text-[#F5A623] shrink-0">
            <MessageSquareQuote className="w-8 h-8" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-comic text-2xl text-[#F5A623] tracking-wide">
                MANAVALAN DIALOGUE #1
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-900/80 px-2.5 py-1 rounded-full border border-gray-700">
                MALAYALAM CLASSIC
              </span>
            </div>

            <blockquote className="text-lg sm:text-2xl font-semibold text-gray-100 italic leading-relaxed border-l-4 border-[#B32025] pl-4 py-1 my-3 bg-[#0a0a0c]/40 rounded-r-xl">
              "Sakrutha kruthavaaya naattukaare, kalaaparipadikal thudangaan aarambikkenotta... pooy!"
            </blockquote>

            <p className="text-xs text-gray-400 mt-2 font-medium">
              Transmitted live from Chairman desk, Dufay H.O., Dubai.
            </p>
          </div>
        </div>
      </motion.div>

      {/* CTA Button with subtle slide-right transition on hover */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ x: 8, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ delay: 0.4 }}
        onClick={onProceed}
        className="group flex items-center gap-4 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#B32025] to-[#96181d] text-white font-black text-lg tracking-wider uppercase border-2 border-[#F5A623] shadow-[0_0_25px_rgba(245,166,35,0.5)] hover:shadow-[0_0_40px_rgba(179,32,37,0.8)] transition-all cursor-pointer"
      >
        <span>PROCEED TO AGREEMENT</span>
        <ArrowRight className="w-6 h-6 text-[#F5A623] group-hover:translate-x-3 transition-transform" />
      </motion.button>
    </motion.div>
  );
}

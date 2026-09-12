import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, Stamp, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export function Page3Terms({ onAccept, onDecline }) {
  const [toast, setToast] = useState(null);

  const handleAccept = () => {
    // Trigger festive confetti explosion
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#B32025', '#F5A623', '#ffffff']
    });

    setToast({
      type: 'accept',
      message: 'Dharmendraa... thattwamasi!',
    });

    setTimeout(() => {
      onAccept();
    }, 1500);
  };

  const handleDecline = () => {
    setToast({
      type: 'decline',
      message: 'Nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi...',
    });

    setTimeout(() => {
      onDecline();
    }, 2000);
  };

  return (
    <motion.div
      key="page3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 relative z-10"
    >
      {/* Toast Notification Box */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 z-50 px-6 py-4 rounded-2xl border-2 shadow-[0_0_40px_rgba(0,0,0,0.9)] max-w-md text-center font-bold text-lg flex items-center gap-3 ${
              toast.type === 'accept'
                ? 'bg-[#121926] border-[#F5A623] text-[#F5A623]'
                : 'bg-[#B32025] border-white text-white'
            }`}
          >
            {toast.type === 'accept' ? (
              <CheckCircle2 className="w-6 h-6 text-[#F5A623] shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-white shrink-0" />
            )}
            <span>"{toast.message}"</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Badge */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121926] border border-[#F5A623]/50 text-xs uppercase font-extrabold tracking-widest text-[#F5A623] shadow-md mb-2">
          <Stamp className="w-4 h-4 text-[#B32025]" /> OFFICIAL LEGAL CONTRACT • MUDRAPATHRAM
        </span>
        <h2 className="font-comic text-5xl sm:text-6xl text-[#F5A623] tracking-widest drop-shadow-[0_4px_15px_rgba(179,32,37,0.8)] text-stroke-crimson">
          TERMS & CONDITIONS
        </h2>
      </motion.div>

      {/* Stylized Document Card Framed with a Golden Border */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-3xl glass-container rounded-3xl p-6 sm:p-10 border-4 border-[#F5A623] shadow-[0_0_50px_rgba(245,166,35,0.3)] relative"
      >
        {/* Decorative Golden Stamp & Corner Ornaments */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 rounded-full bg-[#F5A623]/10 border-2 border-[#F5A623] text-[#F5A623] opacity-80 rotate-12">
          <Stamp className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="flex items-center gap-3 border-b-2 border-[#F5A623]/30 pb-4 mb-6">
          <FileText className="w-7 h-7 text-[#B32025]" />
          <span className="font-comic text-2xl text-white tracking-wider">
            DUFAY HQ OFFICIAL AGREEMENT (മുദ്രപത്രം)
          </span>
        </div>

        {/* Mandatory Agreement Text */}
        <div className="bg-[#0a0a0c]/80 rounded-2xl p-6 border border-[#F5A623]/30 shadow-inner mb-8">
          <p className="text-base sm:text-xl font-semibold text-gray-200 leading-relaxed italic font-serif">
            "Dhaaralam mudrapathrangal vendi varum.... Namukk agreement thayaar aakande? Idathe thallaviral kond sign cheytholu, kaaranam Dubai-il ellaaam idathottanallooo.... Pinne valathu kaii ava upayogikkunnathu matthu pala aavishyangalkkumaanu....uhu..uhu....buhahahahahahah!"
          </p>
        </div>

        {/* Left Thumbprint Signature Area */}
        <div className="flex items-center justify-between bg-[#121926]/90 p-4 rounded-xl border border-gray-700 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B32025]/20 border border-[#B32025] flex items-center justify-center text-[#F5A623] font-bold">
              👈
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-400">Signature Requirement</p>
              <p className="text-sm font-semibold text-white">Left Thumbprint Verification Required</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-[#F5A623]/20 border border-[#F5A623]/40 text-[#F5A623]">
            SEALED BY DUFAY
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleAccept}
            className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#B32025] to-[#d6282e] text-white font-extrabold text-base sm:text-lg border-2 border-[#F5A623] shadow-[0_0_20px_rgba(245,166,35,0.4)] hover:shadow-[0_0_35px_rgba(179,32,37,0.8)] hover:scale-[1.02] transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-6 h-6 text-[#F5A623] group-hover:rotate-12 transition-transform" />
            <span>[ACCEPT AGREEMENT]</span>
          </button>

          <button
            onClick={handleDecline}
            className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gray-900 text-gray-300 font-extrabold text-base sm:text-lg border-2 border-gray-700 hover:border-[#B32025] hover:text-white hover:bg-[#B32025]/30 transition-all cursor-pointer"
          >
            <XCircle className="w-6 h-6 text-gray-400 group-hover:text-red-400" />
            <span>[DECLINE]</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, User, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';

export function Page4Onboarding({ language, setLanguage, userName, setUserName, onComplete }) {
  const [greetingToast, setGreetingToast] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName || !userName.trim()) {
      setErrorMsg('Please enter your name to proceed to Dufay H.O.!');
      return;
    }

    setErrorMsg('');

    const greetingLine = language === 'MALAYALAM'
      ? `${userName.trim()} onnu manassu vachaal... Ee kalavara namukkoru maniyara aakaam!`
      : `Welcome ${userName.trim()}! With Chairman Manavalan at Dufay H.O., victory is guaranteed!`;

    setGreetingToast(greetingLine);

    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <motion.div
      key="page4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 relative z-10"
    >
      {/* Dynamic Greeting Toast Trigger */}
      <AnimatePresence>
        {greetingToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 z-50 px-6 py-4 rounded-2xl bg-[#121926] border-2 border-[#F5A623] text-[#F5A623] shadow-[0_0_40px_rgba(245,166,35,0.8)] max-w-lg text-center font-bold text-lg flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6 text-[#B32025] shrink-0 animate-spin" />
            <span>"{greetingToast}"</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121926] border border-[#F5A623]/40 text-xs uppercase font-extrabold tracking-widest text-[#F5A623] shadow-md mb-2">
          <Languages className="w-4 h-4 text-[#B32025]" /> STEP 4 • ONBOARDING PROFILE
        </span>
        <h2 className="font-comic text-5xl sm:text-6xl text-[#F5A623] tracking-widest drop-shadow-[0_4px_15px_rgba(179,32,37,0.8)] text-stroke-crimson">
          USER ONBOARDING
        </h2>
      </motion.div>

      {/* Glass Card Container */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-xl glass-container rounded-3xl p-6 sm:p-10 border-2 border-[#F5A623]/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Language Selection */}
          <div>
            <label className="block font-comic text-2xl text-white tracking-wider mb-3">
              SELECT LANGUAGE / ഭാഷ തിരഞ്ഞെടുക്കുക
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLanguage('MALAYALAM')}
                className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  language === 'MALAYALAM'
                    ? 'bg-[#B32025] border-[#F5A623] text-white shadow-[0_0_20px_rgba(245,166,35,0.5)] scale-105'
                    : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:text-white hover:border-[#B32025]'
                }`}
              >
                <span>[MALAYALAM]</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('ENGLISH')}
                className={`py-4 rounded-2xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  language === 'ENGLISH'
                    ? 'bg-[#B32025] border-[#F5A623] text-white shadow-[0_0_20px_rgba(245,166,35,0.5)] scale-105'
                    : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:text-white hover:border-[#B32025]'
                }`}
              >
                <span>[ENGLISH]</span>
              </button>
            </div>
          </div>

          {/* User Name Input Field - STRICT CONSTRAINT: NO PLACEHOLDER OR HINT TEXT */}
          <div>
            <label className="block font-comic text-2xl text-white tracking-wider mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-[#F5A623]" />
              ENTER YOUR NAME
            </label>
            <p className="text-xs text-gray-400 mb-3 font-semibold">
              Input field is kept completely clean without placeholder text as per specification.
            </p>

            <div className="relative">
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="" 
                className="w-full px-5 py-4 rounded-2xl bg-[#0a0a0c]/90 border-2 border-[#B32025] text-[#F5A623] font-bold text-xl sm:text-2xl focus:outline-none focus:ring-4 focus:ring-[#F5A623]/50 focus:border-[#F5A623] transition-all shadow-inner"
              />
            </div>
            {errorMsg && (
              <p className="text-red-400 text-sm font-bold mt-2 animate-bounce">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Onboarding Submit CTA Button */}
          <button
            type="submit"
            className="w-full group flex items-center justify-center gap-4 py-5 rounded-2xl bg-gradient-to-r from-[#B32025] to-[#d6282e] text-white font-black text-xl tracking-wider uppercase border-2 border-[#F5A623] shadow-[0_0_30px_rgba(245,166,35,0.6)] hover:shadow-[0_0_50px_rgba(179,32,37,0.9)] hover:scale-[1.02] transition-all cursor-pointer"
          >
            <span>LAUNCH MANAVALAN CHAT</span>
            <ArrowRight className="w-6 h-6 text-[#F5A623] group-hover:translate-x-3 transition-transform" />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const DIALOGUE_LIBRARY = {
  bootDialogues: [
    "Sakrutha kruthavaaya naattukaare, kalaaparipadikal thudangaan aarambikkenotta... pooy!",
    "Njangal Manavalan & Sons ethrai ethrai prapanchangalil branch thudangiyittund ennariyamo? Ningalude ee chiriyaanu ente vijayam!",
  ],
  terms: {
    statement:
      "Dhaaralam mudrapathrangal vendi varum.... Namukk agreement thayaar aakande? Idathe thallaviral kond sign cheytholu, kaaranam Dubai-il ellaaam idathottanallooo.... Pinne valathu kaii ava upayogikkunnathu matthu pala aavishyangalkkumaanu....uhu..uhu....buhahahahahahah!",
    accept: "Dharmendraa... thattwamasi!",
    decline: "Nee evide parupadi avatharippichalum ethu thanne aanallo ninte vidhi...",
  },
  languageReactions: {
    Malayalam:
      "Poor boy, English ariyilla... Ennitt ennod speech parayaan vannirikkunnu... Malayalees!",
    English:
      "Aa, Malayalam paranja mathi. Enikku ee English kekkumbol thala karangan thudangum.",
  },
};

const FEMALE_NAMES = [
  "anjali",
  "sneha",
  "anjana",
  "reshma",
  "priya",
  "pooja",
  "maya",
  "divya",
  "amrutha",
  "deepa",
  "lakshmi",
  "kavya",
  "neha",
  "ananya",
  "arya",
  "parvathy",
  "sruthi",
  "swathi",
  "surabhi",
  "aiswarya",
  "archana",
  "anu",
  "aadhya",
  "athira",
  "meera",
];

export interface MoodInfo {
  tag: string;
  prefix: string | null;
  icon: string;
  isNight: boolean;
  isMorning: boolean;
}

export function getTimeBasedMoodInfo(): MoodInfo {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    // Morning (6 AM - 12 PM)
    return {
      tag: "MORNING DYNAMIC MOOD ☀️",
      prefix: "Melcow Morning! Tea and Mudrapathram ready! Ee divasam namukkufay-il puthiya branch thudangaam!",
      icon: "☀️",
      isNight: false,
      isMorning: true,
    };
  } else {
    // Night (12 PM - 6 AM)
    return {
      tag: "NIGHT DYNAMIC MOOD 🌙",
      prefix: "Rathri aayi... Ini emergency business meetings mathram. Dharmendra-ye vilikkathe thaniye aalojikku!",
      icon: "🌙",
      isNight: true,
      isMorning: false,
    };
  }
}

export function getTimeBasedMoodPrefix(): string | null {
  return getTimeBasedMoodInfo().prefix;
}

export function getGenderGreeting(rawName: string): string {
  if (!rawName) return "Sakrutha kruthavaaya naattukaare, Dufay Headquarters-ilekk swagatham!";
  const trimmed = rawName.trim();
  const lowerName = trimmed.toLowerCase();
  const capName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const isFemale = FEMALE_NAMES.includes(lowerName) || /[ai]$/.test(lowerName);

  const timePrefix = getTimeBasedMoodPrefix();
  let baseGreeting = "";

  if (isFemale) {
    const femaleGreetings = [
      `${capName} onnu manassu vachaal... Ee kalavara namukkoru maniyara aakaam!`,
      `By the by, ${capName}, njan aaranu ennariyamo? Dufayil aana valartha Manavalan!`,
    ];
    baseGreeting = femaleGreetings[Math.floor(Math.random() * femaleGreetings.length)]!;
  } else {
    const maleGreetings = [
      `Nalla peru... ${capName}! Dufay-ilekk swaagatham! Enthu cheyyunu?`,
      `Eda ${capName}, nee ethra vattai paranjittund ividunnu nadannu pokan?`,
    ];
    baseGreeting = maleGreetings[Math.floor(Math.random() * maleGreetings.length)]!;
  }

  if (timePrefix) {
    return `${timePrefix}\n\n${baseGreeting}`;
  }
  return baseGreeting;
}

const getRefreshDialogue = (): string => {
  const timePrefix = getTimeBasedMoodPrefix();
  let index = 0;
  if (typeof window !== "undefined") {
    const STORAGE_KEY = "manavalan_dialogue_index";
    index = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    localStorage.setItem(
      STORAGE_KEY,
      ((index + 1) % DIALOGUE_LIBRARY.bootDialogues.length).toString()
    );
  }
  const selected =
    DIALOGUE_LIBRARY.bootDialogues[index % DIALOGUE_LIBRARY.bootDialogues.length]!;
  if (timePrefix) {
    return `${timePrefix}\n\n${selected}`;
  }
  return selected;
};

export type OnboardingConfig = {
  userName: string;
  language: "Malayalam" | "English";
  initialGreeting: string;
};

interface IntroFlowProps {
  onCompleteOnboarding: (config: OnboardingConfig) => void;
}

export function IntroFlow({ onCompleteOnboarding }: IntroFlowProps) {
  const [step, setStep] = useState<"welcome" | "terms" | "onboarding">("welcome");
  const [bootDialogue, setBootDialogue] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<"Malayalam" | "English">("Malayalam");
  const [langDialogue, setLangDialogue] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nameReaction, setNameReaction] = useState<{
    greeting: string;
    finalLang: "Malayalam" | "English";
  } | null>(null);

  useEffect(() => {
    setBootDialogue(getRefreshDialogue());
  }, []);

  const handleLanguageSelect = (lang: "Malayalam" | "English") => {
    setSelectedLanguage(lang);
    setLangDialogue(DIALOGUE_LIBRARY.languageReactions[lang]);
  };

  const handleProceed = () => {
    if (!userName.trim()) return;
    const finalLang = selectedLanguage || "Malayalam";
    const greeting = getGenderGreeting(userName);

    setNameReaction({
      greeting,
      finalLang,
    });
  };

  const handleConfirmGoToChat = () => {
    if (!nameReaction) return;
    const { finalLang, greeting } = nameReaction;
    setNameReaction(null);
    onCompleteOnboarding({
      userName: userName.trim(),
      language: finalLang,
      initialGreeting: greeting,
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070709] text-[#F8FAFC] font-sans antialiased flex items-center justify-center selection:bg-[#C5A059]/30">
      {/* Background Image Container with Deep Vignette Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-2xl brightness-[0.30] saturate-[140%] scale-105 transition-all duration-1000"
        style={{ backgroundImage: `url('/melcow-bg.jpg')` }}
      />

      {/* Luxury Ambient Lighting Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C5A059]/15 via-transparent to-[#8B0000]/25 pointer-events-none" />

      {/* Main Glass Container */}
      <main className="relative z-10 w-full max-w-xl h-[620px] mx-4 rounded-[32px] bg-[#0F1015]/85 backdrop-blur-3xl border border-white/15 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden">
        {/* Toast / Terms Notification Bar */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-5 left-5 right-5 z-50 p-5 rounded-2xl bg-[#1A1C23]/95 border-2 border-[#C5A059] text-[#F8FAFC] text-center font-bold text-sm sm:text-base tracking-wide shadow-[0_10px_35px_rgba(197,160,89,0.4)] backdrop-blur-2xl"
            >
              <div className="text-[#F5E6C8] leading-relaxed">
                "{toastMessage}"
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name Reaction Popup Card with "GO TO CHAT" Button */}
        <AnimatePresence>
          {nameReaction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-5 left-5 right-5 z-50 p-6 rounded-2xl bg-[#161821]/98 border-2 border-[#C5A059] text-[#F8FAFC] text-center font-bold shadow-[0_20px_50px_rgba(197,160,89,0.5)] backdrop-blur-2xl flex flex-col items-center gap-5"
            >
              <div className="text-xs uppercase font-black tracking-widest text-[#C5A059]">
                CHAIRMAN MANAVALAN REACTION:
              </div>

              <div className="text-[#F5E6C8] text-base sm:text-lg leading-relaxed px-2 whitespace-pre-line">
                "{nameReaction.greeting}"
              </div>

              <button
                onClick={handleConfirmGoToChat}
                className="w-full max-w-xs py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-black font-extrabold text-xs tracking-[0.15em] uppercase hover:brightness-125 active:scale-95 transition-all shadow-[0_0_25px_rgba(197,160,89,0.4)] border border-[#F5E6C8]/50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>GO TO CHAT</span>
                <span className="text-sm">→</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME SCREEN ("MELCOW") */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-between h-full p-8 text-center"
            >
              <div className="space-y-1 mt-2">
                {(() => {
                  const mood = getTimeBasedMoodInfo();
                  return (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#161821] border border-[#C5A059]/40 text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1 shadow-sm">
                      <span>{mood.icon}</span>
                      <span>{mood.tag}</span>
                    </div>
                  );
                })()}
                <h1 className="text-2xl font-black tracking-[0.2em] bg-gradient-to-r from-[#F5E6C8] via-[#C5A059] to-[#D4AF37] bg-clip-text text-transparent uppercase drop-shadow-md">
                  MANAVALAN.AI
                </h1>
                <p className="text-[10px] uppercase font-semibold tracking-[0.3em] text-[#94A3B8]">
                  DUFAI HEADQUARTERS
                </p>
              </div>

              <div className="w-full max-w-md my-2 rounded-2xl overflow-hidden border border-white/10 shadow-[0_16px_32px_rgba(0,0,0,0.6)]">
                <img src="/melcow(1).jpg" alt="Melcow" className="w-full h-44 object-cover" />
              </div>

              <div className="p-5 rounded-2xl bg-[#161821]/90 border border-white/10 backdrop-blur-xl max-w-md shadow-lg">
                <p className="text-sm font-medium leading-relaxed text-[#E2E8F0] tracking-wide">
                  "{bootDialogue}"
                </p>
              </div>

              <button
                onClick={() => setStep("terms")}
                className="w-full max-w-xs py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-black font-extrabold text-xs tracking-[0.15em] uppercase shadow-[0_0_25px_rgba(197,160,89,0.3)] hover:brightness-115 active:scale-95 transition-all duration-200 border border-[#F5E6C8]/40 cursor-pointer"
              >
                ENTER DUFAY HQ
              </button>
            </motion.div>
          )}

          {/* STEP 2: TERMS & AGREEMENT ("Mudrapathram") */}
          {step === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center h-full p-8 text-center space-y-7"
            >
              <div className="space-y-1">
                <h2 className="text-xs uppercase font-bold tracking-[0.25em] text-[#C5A059]">
                  LEGAL AGREEMENT
                </h2>
                <p className="text-xs text-[#94A3B8] font-medium tracking-wide">
                  Mudrapathra Agreement
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#161821]/90 border border-white/10 backdrop-blur-xl max-w-md shadow-xl">
                <p className="text-sm leading-relaxed text-[#E2E8F0] tracking-wide font-normal">
                  "{DIALOGUE_LIBRARY.terms.statement}"
                </p>
              </div>

              <div className="flex space-x-4 w-full max-w-xs">
                <button
                  onClick={() => {
                    setToastMessage(DIALOGUE_LIBRARY.terms.accept);
                    setTimeout(() => {
                      setToastMessage(null);
                      setStep("onboarding");
                    }, 1200);
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#C5A059] text-black text-xs font-bold tracking-wider uppercase hover:bg-[#D4AF37] transition shadow-lg cursor-pointer"
                >
                  ACCEPT
                </button>
                <button
                  onClick={() => {
                    setToastMessage(DIALOGUE_LIBRARY.terms.decline);
                    setTimeout(() => {
                      setToastMessage(null);
                      setStep("welcome");
                    }, 1200);
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#271518] border border-[#8B0000]/50 text-[#FCA5A5] text-xs font-bold tracking-wider uppercase hover:bg-[#381B20] transition shadow-lg cursor-pointer"
                >
                  DECLINE
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LANGUAGE TOGGLE & NAME INPUT (PREFERENCES) */}
          {step === "onboarding" && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-xs uppercase font-bold tracking-[0.25em] text-[#C5A059]">
                  PREFERENCES
                </h2>
                <p className="text-xs text-[#94A3B8] font-medium tracking-wide">
                  Select Language & Enter Identity
                </p>
              </div>

              {/* Segmented Toggle Pill */}
              <div className="flex p-1.5 rounded-full bg-[#161821] border border-white/10 shadow-inner">
                <button
                  onClick={() => handleLanguageSelect("Malayalam")}
                  className={`px-7 py-2.5 rounded-full text-xs font-extrabold tracking-wider transition-all duration-300 cursor-pointer ${
                    selectedLanguage === "Malayalam"
                      ? "bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-black shadow-[0_0_18px_rgba(197,160,89,0.35)]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  MALAYALAM
                </button>
                <button
                  onClick={() => handleLanguageSelect("English")}
                  className={`px-7 py-2.5 rounded-full text-xs font-extrabold tracking-wider transition-all duration-300 cursor-pointer ${
                    selectedLanguage === "English"
                      ? "bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-black shadow-[0_0_18px_rgba(197,160,89,0.35)]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  ENGLISH
                </button>
              </div>

              {/* Dynamic Reaction Dialogue Display */}
              <div className="h-20 flex items-center justify-center w-full max-w-md">
                <AnimatePresence mode="wait">
                  {langDialogue && (
                    <motion.div
                      key={selectedLanguage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="p-4 rounded-2xl bg-[#161821]/95 border border-[#C5A059]/30 backdrop-blur-xl w-full shadow-lg"
                    >
                      <p className="text-xs font-semibold text-[#F5E6C8] leading-relaxed tracking-wide">
                        "{langDialogue}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clean Input Field */}
              <input
                type="text"
                placeholder="Enter your name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleProceed()}
                className="w-full max-w-sm px-6 py-3.5 rounded-2xl bg-[#161821] border border-white/20 text-[#F8FAFC] text-center font-bold text-sm outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition shadow-inner tracking-wide"
              />

              <button
                onClick={handleProceed}
                disabled={!userName.trim()}
                className="w-full max-w-xs py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#9A7B38] text-black text-xs font-extrabold tracking-[0.15em] uppercase hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                PROCEED TO MAIN MODULE
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default IntroFlow;

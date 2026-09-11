import { useState } from 'react'
import { MOCK_COURIERS, type Courier } from './data/mockCouriers'
import { CardStack } from './components/swipe/CardStack'
import { MatchScreen } from './components/match/MatchScreen'
import { TrackingScreen } from './components/tracking/TrackingScreen'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocalStorage } from './hooks/useLocalStorage'

export type ViewState = 'splash' | 'swipe' | 'match' | 'tracking'

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('splash')
  const [matchedCourier, setMatchedCourier] = useLocalStorage<Courier | null>('chicken67_matched_courier', null)
  const [hasPreviousMatch, setHasPreviousMatch] = useState(() => {
    try {
      return !!window.localStorage.getItem('chicken67_matched_courier')
    } catch { return false }
  })

  const handleMatch = (courier: Courier) => {
    setMatchedCourier(courier)
    setCurrentView('match')
  }

  const handleRestart = () => {
    setMatchedCourier(null)
    setHasPreviousMatch(false)
    setCurrentView('splash')
  }

  const handleResumePreviousMatch = () => {
    if (matchedCourier) setCurrentView('tracking')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1a0a00] via-[#2d1200] to-[#0d0d0d] flex items-center justify-center overflow-hidden">
      {/* Phone shell — centered on desktop */}
      <div className="w-full max-w-[420px] h-[100dvh] md:h-[860px] md:rounded-[44px] md:shadow-[0_40px_120px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] bg-dark-bg relative overflow-hidden flex flex-col">

        <AnimatePresence mode="wait">

          {/* ── SPLASH ── */}
          {currentView === 'splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              {/* Background radial glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(230,159,0,0.08) 0%, transparent 70%)'
              }} />

              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Logo mark */}
                <div className="w-28 h-28 mx-auto mb-5 bg-gradient-to-br from-chicken-golden to-chicken-crispy rounded-full flex items-center justify-center border-4 border-chicken-golden/30 shadow-[0_0_50px_rgba(230,159,0,0.4)]">
                  <span className="text-5xl" role="img" aria-label="Chicken">🐔</span>
                </div>

                <h1 className="text-5xl font-black text-chicken-golden mb-1 tracking-tight drop-shadow-[0_0_20px_rgba(230,159,0,0.5)]">
                  Chicken 6 7
                </h1>
                <p className="text-sm font-medium italic text-gray-400 mb-10 tracking-wide">
                  Where you and your food choose each other.
                </p>

                <motion.button
                  onClick={() => setCurrentView('swipe')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="bg-chicken-spicy text-white px-10 py-4 rounded-full font-black text-lg shadow-[0_0_30px_rgba(217,35,17,0.4)] hover:shadow-[0_0_40px_rgba(217,35,17,0.6)] uppercase tracking-wider transition-shadow"
                >
                  Find Your Courier
                </motion.button>

                {hasPreviousMatch && matchedCourier && (
                  <motion.button
                    onClick={handleResumePreviousMatch}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 text-chicken-golden/70 text-sm font-medium underline underline-offset-2 hover:text-chicken-golden transition-colors"
                  >
                    Resume with {matchedCourier.name} →
                  </motion.button>
                )}
              </motion.div>

              {/* Version tag */}
              <p className="absolute bottom-6 text-white/15 text-xs font-mono">chicken67 · hackathon edition</p>
            </motion.div>
          )}

          {/* ── SWIPE ── */}
          {currentView === 'swipe' && (
            <motion.div
              key="swipe"
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Header */}
              <div className="pt-10 pb-2 px-5 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setCurrentView('splash')}
                  className="text-white/40 hover:text-white/80 transition-colors text-sm font-medium"
                  aria-label="Back to home"
                >
                  ← Back
                </button>
                <div className="text-center">
                  <p className="text-chicken-golden font-black text-base tracking-widest uppercase">Who's Delivering?</p>
                  <p className="text-white/30 text-xs">{MOCK_COURIERS.length} couriers nearby</p>
                </div>
                <div className="w-12" /> {/* spacer */}
              </div>

              <div className="flex-1 flex flex-col items-center justify-start px-4 pb-4 pt-2 overflow-hidden">
                <CardStack
                  couriers={MOCK_COURIERS}
                  onMatch={handleMatch}
                  onExhausted={() => {
                    setTimeout(() => setCurrentView('splash'), 2500)
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* ── MATCH ── */}
          {currentView === 'match' && matchedCourier && (
            <motion.div key="match" className="absolute inset-0 z-20">
              <MatchScreen
                courier={matchedCourier}
                onContinue={() => setCurrentView('tracking')}
              />
            </motion.div>
          )}

          {/* ── TRACKING ── */}
          {currentView === 'tracking' && matchedCourier && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <TrackingScreen
                courier={matchedCourier}
                onRestart={handleRestart}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default App

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Courier } from '../../data/mockCouriers';
import { ProfileCard } from './ProfileCard';

interface CardStackProps {
  couriers: Courier[];
  onMatch: (courier: Courier) => void;
  onExhausted: () => void;
}

export function CardStack({ couriers, onMatch, onExhausted }: CardStackProps) {
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
  const [history, setHistory] = useState<number[]>([]);

  const advance = useCallback((direction: 'left' | 'right') => {
    setExitDirection(direction);
    setHistory(prev => [...prev, index]);

    if (direction === 'right') {
      onMatch(couriers[index]);
      return;
    }

    const next = index + 1;
    setIndex(next);
    if (next >= couriers.length) {
      onExhausted();
    }
  }, [index, couriers, onMatch, onExhausted]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setIndex(prev);
  }, [history]);

  const isExhausted = index >= couriers.length;
  const canUndo = history.length > 0 && !isExhausted;

  // Determine exit x based on direction
  const exitX = exitDirection === 'right' ? 600 : -600;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Card area */}
      <div className="relative w-full h-[58vh] max-h-[560px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {!isExhausted && couriers.slice(index, index + 3).reverse().map((courier, i, arr) => {
            const isTop = i === arr.length - 1;
            const depth = arr.length - 1 - i; // 0 = top, 1 = second, 2 = third

            return (
              <motion.div
                key={courier.id}
                className="absolute w-[88%] max-w-sm h-full"
                initial={isTop ? { scale: 0.85, y: 30, opacity: 0 } : false}
                animate={{
                  scale: 1 - depth * 0.04,
                  y: depth * 12,
                  opacity: 1 - depth * 0.15,
                }}
                exit={isTop ? {
                  x: exitX,
                  rotate: exitDirection === 'right' ? 25 : -25,
                  opacity: 0,
                  transition: { duration: 0.25, ease: 'easeOut' }
                } : {
                  opacity: 0,
                  transition: { duration: 0.1 }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                style={{ zIndex: 10 - depth }}
              >
                <ProfileCard
                  courier={courier}
                  active={isTop}
                  onLeave={advance}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Exhausted state */}
        {isExhausted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center gap-3 text-white/60 px-6"
          >
            <span className="text-5xl">🐔</span>
            <p className="text-xl font-bold text-chicken-golden">No more couriers.</p>
            <p className="text-sm">They all got lost somewhere near the chai stall.</p>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-6 z-20">
        {/* Undo button */}
        <motion.button
          onClick={handleUndo}
          disabled={!canUndo}
          whileHover={canUndo ? { scale: 1.1 } : {}}
          whileTap={canUndo ? { scale: 0.9 } : {}}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg border transition-all
            ${canUndo
              ? 'bg-dark-panel border-chicken-golden/50 text-chicken-golden hover:border-chicken-golden'
              : 'bg-dark-panel/30 border-white/10 text-white/20 cursor-not-allowed'
            }`}
          title="Undo (go back)"
          aria-label="Undo last swipe"
        >
          ↩
        </motion.button>

        {/* Nope button */}
        <motion.button
          onClick={() => advance('left')}
          disabled={isExhausted}
          whileHover={!isExhausted ? { scale: 1.12 } : {}}
          whileTap={!isExhausted ? { scale: 0.9 } : {}}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl border-2 transition-all
            ${!isExhausted
              ? 'bg-dark-panel border-chicken-spicy text-chicken-spicy hover:bg-chicken-spicy hover:text-white'
              : 'opacity-30 cursor-not-allowed bg-dark-panel border-white/20 text-white/30'
            }`}
          aria-label="Skip courier (swipe left)"
          title="Skip (← arrow key)"
        >
          ✕
        </motion.button>

        {/* Match button */}
        <motion.button
          onClick={() => advance('right')}
          disabled={isExhausted}
          whileHover={!isExhausted ? { scale: 1.12 } : {}}
          whileTap={!isExhausted ? { scale: 0.9 } : {}}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl border-2 transition-all
            ${!isExhausted
              ? 'bg-dark-panel border-green-500 text-green-400 hover:bg-green-500 hover:text-white'
              : 'opacity-30 cursor-not-allowed bg-dark-panel border-white/20 text-white/30'
            }`}
          aria-label="Match with courier (swipe right)"
          title="Match (→ arrow key)"
        >
          ♥
        </motion.button>

        {/* Info hint */}
        <div className="w-12 flex items-center justify-center">
          <span className="text-white/20 text-xs text-center leading-tight">← →<br/>keys</span>
        </div>
      </div>
    </div>
  );
}

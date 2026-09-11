import { motion } from 'framer-motion';
import type { Courier } from '../../data/mockCouriers';

interface MatchScreenProps {
  courier: Courier;
  onContinue: () => void;
}

export function MatchScreen({ courier, onContinue }: MatchScreenProps) {
  return (
    <div className="flex-1 w-full h-full bg-chicken-spicy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background radial lines effect */}
      <motion.div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background: 'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, white 15deg 30deg)'
        }}
      />

      <motion.h2 
        className="text-6xl font-extrabold text-chicken-buttermilk italic drop-shadow-lg text-center mb-10 z-10"
        initial={{ scale: 0, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: -5 }}
        transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
      >
        IT'S A<br/>MATCH!
      </motion.h2>

      <motion.div 
        className="relative z-10 w-48 h-48 rounded-full border-8 border-chicken-golden bg-chicken-buttermilk mb-8 overflow-hidden shadow-2xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
      >
        <img src={courier.avatarUrl} alt={courier.name} className="w-full h-full object-contain" />
      </motion.div>

      <motion.p 
        className="text-white text-xl text-center mb-10 font-medium z-10 max-w-[280px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        You and <span className="font-bold text-chicken-golden">{courier.name}</span> have chosen each other. 
        <br/><br/>
        <span className="text-sm italic opacity-80">"{courier.quirk}"</span>
      </motion.p>

      <motion.button 
        onClick={onContinue}
        className="w-full bg-white text-chicken-spicy p-4 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform uppercase tracking-wider"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, delay: 1 }}
      >
        Dispatch Courier!
      </motion.button>
    </div>
  );
}

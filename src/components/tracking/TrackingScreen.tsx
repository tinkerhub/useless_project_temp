import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFakeTracking } from '../../hooks/useFakeTracking';
import type { Courier } from '../../data/mockCouriers';
import { MOCK_MENU, type FoodItem } from '../../data/mockMenu';

interface TrackingScreenProps {
  courier: Courier;
  onRestart: () => void;
}

export function TrackingScreen({ courier, onRestart }: TrackingScreenProps) {
  const { currentStatus, progress, isDelivered } = useFakeTracking();
  const [secretFood, setSecretFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    // Pick a random food item on mount
    const randomItem = MOCK_MENU[Math.floor(Math.random() * MOCK_MENU.length)];
    setSecretFood(randomItem);
  }, []);

  return (
    <div className="flex-1 w-full h-full bg-dark-bg flex flex-col relative overflow-hidden">
      
      {/* Fake Map Background */}
      <div className="absolute inset-0 bg-gray-900 pointer-events-none opacity-50" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 2px, transparent 2px)',
        backgroundSize: '40px 40px'
      }}>
        {/* Destination Pin */}
        <div className="absolute top-1/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-chicken-golden rounded-full border-4 border-dark-bg z-10 relative flex items-center justify-center">
            <span className="text-dark-bg text-xs font-black">YOU</span>
          </div>
        </div>
      </div>

      {/* Courier Dot Animation */}
      <motion.div 
        className="absolute top-3/4 left-1/4 w-12 h-12 bg-chicken-buttermilk rounded-full border-4 border-chicken-spicy flex items-center justify-center z-20 shadow-[0_0_20px_rgba(217,35,17,0.8)]"
        initial={{ x: 0, y: 0 }}
        animate={{ 
          x: [0, 50, 20, 150, 120, 200, 220, 180], // Erratic movement towards top-right
          y: [0, -40, -100, -80, -160, -140, -220, -280]
        }}
        transition={{ 
          duration: 32, // Matches total time of fake events
          ease: "easeInOut",
          times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 0.9, 1]
        }}
      >
        <img src={courier.avatarUrl} alt="Courier" className="w-8 h-8 rounded-full" />
      </motion.div>

      {/* Status Overlay */}
      <div className="absolute bottom-0 w-full p-4 z-30">
        <motion.div 
          key={currentStatus} // Re-animates on change
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 bg-dark-panel/90 flex flex-col gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-chicken-golden">
              <img src={courier.avatarUrl} alt={courier.name} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{courier.name}</h3>
              <p className="text-chicken-golden text-sm">{courier.deliveryStyle}</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
            <motion.div 
              className="bg-chicken-spicy h-2 rounded-full" 
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <p className="text-white font-medium text-lg min-h-[3rem] mt-2 italic">
            "{currentStatus}"
          </p>
        </motion.div>
      </div>

      {/* Secret Food Reveal Modal */}
      <AnimatePresence>
        {isDelivered && secretFood && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="bg-dark-panel p-8 rounded-3xl w-full max-w-sm flex flex-col items-center text-center border-4 border-chicken-golden shadow-2xl relative overflow-hidden"
            >
              {/* Confetti effect placeholder */}
              <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-chicken-spicy via-chicken-golden to-chicken-spicy" />
              
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">It's a Surprise!</h2>
              <p className="text-gray-400 mb-6 italic">Your courier has decided you will eat...</p>
              
              <div className="w-32 h-32 bg-chicken-buttermilk rounded-full flex items-center justify-center mb-6 border-4 border-chicken-golden shadow-lg">
                <img src={secretFood.imageUrl} alt={secretFood.name} className="w-20 h-20" />
              </div>
              
              <h3 className="text-3xl font-bold text-chicken-golden mb-2 leading-tight">{secretFood.name}</h3>
              <p className="text-gray-300 mb-8">{secretFood.description}</p>
              
              <button 
                onClick={onRestart}
                className="w-full bg-chicken-spicy text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Over
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

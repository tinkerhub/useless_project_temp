import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_MENU, type FoodItem } from '../../data/mockMenu';
import type { Courier } from '../../data/mockCouriers';

interface MenuScreenProps {
  courier: Courier;
  onCheckout: (cart: FoodItem[]) => void;
}

export function MenuScreen({ courier, onCheckout }: MenuScreenProps) {
  const [cart, setCart] = useState<FoodItem[]>([]);

  const toggleItem = (item: FoodItem) => {
    if (cart.find(i => i.id === item.id)) {
      setCart(cart.filter(i => i.id !== item.id));
    } else {
      setCart([...cart, item]);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="flex-1 w-full h-full bg-dark-bg flex flex-col relative">
      
      {/* Header */}
      <div className="bg-dark-panel p-6 pb-4 pt-12 shadow-md z-10 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-2">
          <img src={courier.avatarUrl} alt={courier.name} className="w-12 h-12 bg-chicken-buttermilk rounded-full border-2 border-chicken-golden" />
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">What can {courier.name} grab for you?</h2>
          </div>
        </div>
        <p className="text-sm text-gray-400 italic">"{courier.bio}"</p>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="space-y-4">
          {MOCK_MENU.map((item, i) => {
            const isSelected = !!cart.find(c => c.id === item.id);
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => toggleItem(item)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-chicken-golden/10 border-chicken-golden' : 'bg-dark-panel border-transparent'}`}
              >
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-chicken-buttermilk rounded-xl flex items-center justify-center shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-bold text-lg leading-tight mb-1">{item.name}</h3>
                      <span className="text-chicken-golden font-bold">₹{item.price}</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-snug">{item.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-chicken-golden bg-chicken-golden' : 'border-gray-500'}`}>
                    {isSelected && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating Checkout Bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-6 left-4 right-4"
          >
            <button 
              onClick={() => onCheckout(cart)}
              className="w-full bg-chicken-spicy text-white p-4 rounded-full font-bold text-lg shadow-xl shadow-chicken-spicy/20 flex justify-between items-center hover:bg-red-600 transition-colors"
            >
              <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              <span>Checkout • ₹{total}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

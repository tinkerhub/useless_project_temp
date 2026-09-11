import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { Courier } from '../../data/mockCouriers';
import { Badge } from '../ui/Badge';

interface ProfileCardProps {
  courier: Courier;
  active: boolean;
  onLeave: (direction: 'left' | 'right') => void;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full ? 1 : i === full && partial > 0 ? partial : 0;
        return (
          <span key={i} className="relative text-gray-600 text-sm">
            ★
            <span
              className="absolute inset-0 overflow-hidden text-yellow-400 text-sm"
              style={{ width: `${filled * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-1 text-yellow-400 font-bold text-sm">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ProfileCard({ courier, active, onLeave }: ProfileCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const nopeOpacity = useTransform(x, [-80, -20], [1, 0]);
  const likeOpacity = useTransform(x, [20, 80], [0, 1]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Keyboard fallback: arrow keys when this card is active
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onLeave('left');
      if (e.key === 'ArrowRight') onLeave('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onLeave]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 90;
    if (info.offset.x > threshold) {
      onLeave('right');
    } else if (info.offset.x < -threshold) {
      onLeave('left');
    }
  };

  const compatibilityColor =
    courier.compatibility >= 85 ? 'success' :
    courier.compatibility >= 60 ? 'gold' : 'spicy';

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 w-full h-full rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, backgroundColor: '#1a1a1a' }}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      dragTransition={{ bounceStiffness: 500, bounceDamping: 25 }}
      whileTap={{ scale: active ? 1.02 : 1 }}
      tabIndex={active ? 0 : -1}
      aria-label={`${courier.name}, ${courier.rating} stars, ${courier.compatibility}% compatibility`}
    >
      {/* NOPE stamp */}
      <motion.div
        className="absolute top-10 right-6 border-4 border-chicken-spicy text-chicken-spicy font-black text-3xl px-4 py-1.5 rounded-xl rotate-12 z-30 pointer-events-none"
        style={{ opacity: nopeOpacity }}
        aria-hidden
      >
        NOPE
      </motion.div>

      {/* MATCH stamp */}
      <motion.div
        className="absolute top-10 left-6 border-4 border-green-400 text-green-400 font-black text-3xl px-4 py-1.5 rounded-xl -rotate-12 z-30 pointer-events-none"
        style={{ opacity: likeOpacity }}
        aria-hidden
      >
        MATCH!
      </motion.div>

      {/* Avatar area */}
      <div className="h-[55%] w-full bg-gradient-to-b from-[#2a1f0e] via-chicken-golden/20 to-transparent flex items-center justify-center pt-6 pb-2">
        <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-chicken-golden shadow-2xl bg-chicken-buttermilk">
          <img
            src={courier.avatarUrl}
            alt={courier.name}
            className="w-full h-full object-cover"
            draggable={false}
            onError={(e) => {
              // Fallback: hide broken image, show initials
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 w-full h-[52%] bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0ddd] to-transparent flex flex-col justify-end px-5 pb-5 pointer-events-none">
        {/* Name + rating row */}
        <div className="flex items-end justify-between mb-1">
          <h2 className="text-3xl font-extrabold text-chicken-golden leading-none drop-shadow-lg">
            {courier.name}
          </h2>
          <Badge variant={compatibilityColor} className="text-sm px-3 py-1">
            ♥ {courier.compatibility}%
          </Badge>
        </div>

        <StarRating rating={courier.rating} />

        {/* Stats row */}
        <div className="flex gap-3 mt-2 mb-2 flex-wrap">
          <Badge variant="muted">📍 {courier.distance}</Badge>
          <Badge variant="muted">⏱ {courier.avgDeliveryTime}</Badge>
          <Badge variant="gold">✓ {courier.successfulDeliveries.toLocaleString()} deliveries</Badge>
        </div>

        {/* Personality tag */}
        <p className="text-chicken-spicy font-bold text-xs uppercase tracking-widest mb-1">
          {courier.deliveryPersonality}
        </p>

        {/* Bio */}
        <p className="text-gray-300 text-sm leading-snug line-clamp-2 italic">
          "{courier.bio}"
        </p>

        {/* Absurd fact chip */}
        <div className="mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
          <span className="text-xs text-chicken-golden font-bold uppercase tracking-wider">Fun Fact · </span>
          <span className="text-xs text-gray-400">{courier.absurdFact}</span>
        </div>
      </div>
    </motion.div>
  );
}

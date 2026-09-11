import type { ReactNode } from 'react';

type BadgeVariant = 'gold' | 'spicy' | 'muted' | 'success' | 'dark';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold: 'bg-chicken-golden/20 text-chicken-golden border border-chicken-golden/40',
  spicy: 'bg-chicken-spicy/20 text-chicken-spicy border border-chicken-spicy/40',
  muted: 'bg-white/10 text-gray-400 border border-white/10',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  dark: 'bg-dark-panel text-chicken-buttermilk border border-white/10',
};

export function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

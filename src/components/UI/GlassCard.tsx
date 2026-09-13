import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = false,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-2xl p-4 text-slate-100 transition-all duration-300',
          interactive && 'glass-panel-interactive cursor-pointer',
          glow && 'border-cyan-500/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

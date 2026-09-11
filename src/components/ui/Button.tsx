import { motion } from 'framer-motion';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-chicken-spicy text-white shadow-[0_0_20px_rgba(217,35,17,0.3)] hover:shadow-[0_0_30px_rgba(217,35,17,0.5)] border border-chicken-spicy',
  secondary: 'bg-chicken-golden text-dark-bg shadow-lg hover:shadow-xl border border-chicken-golden',
  ghost: 'bg-white/10 text-chicken-buttermilk border border-white/20 hover:bg-white/20',
  danger: 'bg-dark-panel text-chicken-spicy border-2 border-chicken-spicy hover:bg-chicken-spicy hover:text-white',
  success: 'bg-dark-panel text-green-400 border-2 border-green-500 hover:bg-green-500 hover:text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-xl rounded-full',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`font-bold uppercase tracking-wider transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}

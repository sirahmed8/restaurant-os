import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { SoundEffectName } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'amber';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  sound?: SoundEffectName;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  sound = 'tap',
  className = '',
  onClick,
  children,
  ...props
}) => {
  const playSound = useAppStore((s) => s.playSound);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound(sound);
    onClick?.(e);
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 active:scale-[0.97]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-xl',
    md: 'text-sm px-4 py-2.5 gap-2 rounded-2xl',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-3xl font-semibold',
    icon: 'p-2.5 rounded-2xl aspect-square',
  }[size];

  const variantStyles = {
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 border border-amber-400/40',
    secondary: 'bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10 hover:border-white/20 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 light:bg-amber-900/5 light:hover:bg-amber-900/10 light:text-stone-900 light:border-stone-300',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white dark:hover:bg-slate-800/50 light:text-stone-700 light:hover:bg-amber-100/60',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:border-rose-500/50',
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 hover:border-amber-500/50',
  }[variant];

  return (
    <button
      type={props.type ?? 'button'}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

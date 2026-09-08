import React from 'react';

interface BadgeProps {
  variant?: 'amber' | 'emerald' | 'rose' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  size = 'md',
  children,
  className = '',
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium rounded-full',
    md: 'text-xs px-3 py-1 font-semibold rounded-full',
  }[size];

  const variantStyles = {
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    blue: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    slate: 'bg-white/5 text-slate-300 border border-white/10 dark:bg-slate-800/80 light:bg-stone-200 light:text-stone-700',
  }[variant];

  const dotColors = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    blue: 'bg-sky-400',
    purple: 'bg-purple-400',
    slate: 'bg-slate-400',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 backdrop-blur-md ${sizeStyles} ${variantStyles} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColors}`} />}
      {children}
    </span>
  );
};

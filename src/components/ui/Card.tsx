import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  interactive = false,
  children,
  className = '',
  ...props
}) => {
  const base = elevated ? 'glass-panel-elevated' : 'glass-panel';
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-3xl p-5 relative overflow-hidden ${base} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

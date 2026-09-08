import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  icon,
  rightElement,
  className = '',
  ...props
}) => {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <div className="absolute start-3.5 flex items-center pointer-events-none text-slate-400">
          {icon}
        </div>
      )}
      <input
        className={`w-full rounded-2xl px-4 py-2.5 text-sm bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all ${
          icon ? 'ps-10' : ''
        } ${rightElement ? 'pe-10' : ''} ${className}`}
        {...props}
      />
      {rightElement && (
        <div className="absolute end-3.5 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};

import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-white/10 light:bg-stone-900/10 ${className}`} />
);

export const EmptyState: React.FC<{
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, hint, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center gap-2 py-10 px-6" role="status">
    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl" aria-hidden="true">
      ◌
    </div>
    <div className="text-sm font-bold">{title}</div>
    {hint && <div className="text-xs opacity-60 max-w-xs">{hint}</div>}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

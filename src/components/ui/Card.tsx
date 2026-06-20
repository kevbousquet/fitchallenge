import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface Props {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, gradient, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl p-4',
        gradient
          ? 'bg-gradient-to-br from-green-600 to-teal-600 text-white shadow-lg shadow-green-600/25'
          : 'bg-white dark:bg-gray-900 shadow-sm shadow-black/5 border border-slate-100 dark:border-gray-800',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className,
      )}
    >
      {children}
    </div>
  );
}

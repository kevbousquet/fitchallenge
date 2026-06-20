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
        'rounded-3xl p-4 shadow-sm',
        gradient
          ? 'bg-gradient-to-br from-green-500 to-teal-500 text-white'
          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700',
        onClick && 'cursor-pointer active:scale-98 transition-transform',
        className,
      )}
    >
      {children}
    </div>
  );
}

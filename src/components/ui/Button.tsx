import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primary' | 'secondary' | 'ghost' | 'danger';
  taille?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  pleine?: boolean;
}

export function Button({ variante = 'primary', taille = 'md', pleine, children, className, ...props }: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          // Tailles
          'px-4 py-2 text-sm':    taille === 'sm',
          'px-5 py-3 text-base':  taille === 'md',
          'px-6 py-4 text-lg':    taille === 'lg',
          'w-full':                pleine,
          // Variantes
          'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-teal-600': variante === 'primary',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700': variante === 'secondary',
          'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800': variante === 'ghost',
          'bg-red-500 text-white hover:bg-red-600': variante === 'danger',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

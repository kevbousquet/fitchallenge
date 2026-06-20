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
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed',
        {
          'px-4 py-2 text-sm':   taille === 'sm',
          'px-5 py-3 text-base': taille === 'md',
          'px-6 py-4 text-base': taille === 'lg',
          'w-full':              pleine,
          'bg-green-600 text-white shadow-md shadow-green-600/30 hover:bg-green-700': variante === 'primary',
          'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700': variante === 'secondary',
          'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-100 hover:bg-slate-100 dark:hover:bg-gray-800': variante === 'ghost',
          'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/25': variante === 'danger',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

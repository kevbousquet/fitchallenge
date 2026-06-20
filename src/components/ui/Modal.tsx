import { type ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';

interface Props {
  ouvert: boolean;
  onFermer: () => void;
  titre?: string;
  children: ReactNode;
  taille?: 'sm' | 'md' | 'lg';
}

export function Modal({ ouvert, onFermer, titre, children, taille = 'md' }: Props) {
  // Bloque le scroll du body quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = ouvert ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [ouvert]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Fond semi-transparent */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onFermer}
      />
      {/* Contenu du modal */}
      <div
        className={clsx(
          'relative w-full bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]',
          {
            'sm:max-w-sm':  taille === 'sm',
            'sm:max-w-md':  taille === 'md',
            'sm:max-w-lg':  taille === 'lg',
          },
        )}
      >
        {/* Barre de tirage (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        {titre && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{titre}</h2>
            <button
              onClick={onFermer}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

import { type ReactNode } from 'react';
import { Navigation } from './Navigation';

interface Props {
  children: ReactNode;
  titre?: string;
  actions?: ReactNode;
}

export function Layout({ children, titre, actions }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* En-tête */}
      {titre && (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between safe-area-pt">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{titre}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}

      {/* Contenu principal */}
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {children}
      </main>

      <Navigation />
    </div>
  );
}

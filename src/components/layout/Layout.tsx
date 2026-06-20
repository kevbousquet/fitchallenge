import { type ReactNode } from 'react';
import { Navigation } from './Navigation';

interface Props {
  children: ReactNode;
  titre?: string;
  actions?: ReactNode;
}

export function Layout({ children, titre, actions }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-28">
      {titre && (
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between safe-area-pt">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{titre}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <main className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {children}
      </main>
      <Navigation />
    </div>
  );
}

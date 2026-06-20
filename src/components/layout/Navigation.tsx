import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const onglets = [
  { to: '/',            emoji: '🏠', label: 'Aujourd\'hui' },
  { to: '/repas',       emoji: '🍽️', label: 'Repas'       },
  { to: '/challenges',  emoji: '🏆', label: 'Challenges'  },
  { to: '/progression', emoji: '📈', label: 'Progression' },
  { to: '/reglages',    emoji: '⚙️', label: 'Réglages'    },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {onglets.map((o) => (
          <NavLink
            key={o.to}
            to={o.to}
            end={o.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-colors min-w-0',
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx('text-xl', isActive && 'scale-110 transition-transform')}>
                  {o.emoji}
                </span>
                <span className="text-[10px] font-medium truncate">{o.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

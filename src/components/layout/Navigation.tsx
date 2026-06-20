import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, Trophy, TrendingUp, Settings } from 'lucide-react';

const onglets = [
  { to: '/',            Icon: Home,            label: "Auj." },
  { to: '/repas',       Icon: UtensilsCrossed, label: 'Repas'       },
  { to: '/challenges',  Icon: Trophy,          label: 'Challenges'  },
  { to: '/progression', Icon: TrendingUp,      label: 'Progression' },
  { to: '/reglages',    Icon: Settings,        label: 'Réglages'    },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-pb">
      <div className="mx-3 mb-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-around px-1 py-1.5">
          {onglets.map((o) => (
            <NavLink key={o.to} to={o.to} end={o.to === '/'} className="flex-1">
              {({ isActive }) => (
                <div className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-green-600' : ''
                }`}>
                  <o.Icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                  />
                  <span className={`text-[9px] font-semibold leading-none tracking-wide ${
                    isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {o.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

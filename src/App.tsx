import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from './lib/supabase';
import { getNbRepasDate, getPesees } from './lib/db';
import { useStore } from './store/useStore';
import { Auth }       from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { Home }       from './pages/Home';
import { Meals }      from './pages/Meals';
import { Challenges } from './pages/Challenges';
import { Progress }   from './pages/Progress';
import { Settings }   from './pages/Settings';

function AppRoutes() {
  const { session, user, chargement, setSession, chargerUser, chargerJournee } = useStore();

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      chargerUser().then(() => {
        if (session) chargerJournee();
      });
    });

    // Écoute les changements d'auth (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      chargerUser().then(() => {
        if (session) chargerJournee();
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Thème sombre
  useEffect(() => {
    if (user?.themeSombre) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.themeSombre]);

  // Rappels notifications
  useEffect(() => {
    if (!user?.id || !('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const heureActuelle = format(now, 'HH:mm');
    const todayStr = format(now, 'yyyy-MM-dd');

    const check = async () => {
      if (user.notifRepasActif && user.notifRepasHeure && heureActuelle >= user.notifRepasHeure) {
        const cleLS = `notif_repas_${todayStr}`;
        if (!localStorage.getItem(cleLS)) {
          const count = await getNbRepasDate(user.id!, todayStr);
          if (count === 0) {
            new Notification('FitChallenge 🍽️', {
              body: "N'oubliez pas de saisir vos repas du jour !",
              icon: '/icon-192.png',
            });
            localStorage.setItem(cleLS, '1');
          }
        }
      }

      if (user.notifPeseeActif && user.notifPeseeHeure && heureActuelle >= user.notifPeseeHeure) {
        const cleLS = `notif_pesee_${todayStr}`;
        if (!localStorage.getItem(cleLS)) {
          const pesees = await getPesees(user.id!);
          const derniere = pesees[pesees.length - 1];
          const joursDepuis = derniere
            ? Math.floor((now.getTime() - new Date(derniere.date).getTime()) / 86_400_000)
            : 999;
          if (joursDepuis >= 3) {
            new Notification('FitChallenge ⚖️', {
              body: `${joursDepuis} jours sans pesée — montez sur la balance !`,
              icon: '/icon-192.png',
            });
            localStorage.setItem(cleLS, '1');
          }
        }
      }
    };

    check();
  }, [user]);

  if (chargement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">💪</div>
        <p className="text-white font-bold text-2xl">FitChallenge</p>
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Pas connecté → page Auth
  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Connecté mais pas de profil créé → onboarding
  if (!user) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Connecté + profil → app complète
  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/repas"       element={<Meals />} />
      <Route path="/challenges"  element={<Challenges />} />
      <Route path="/progression" element={<Progress />} />
      <Route path="/reglages"    element={<Settings />} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

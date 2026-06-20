import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from './db/database';
import { useStore } from './store/useStore';
import { seedDemoData } from './db/seed';
import { Onboarding }      from './pages/Onboarding';
import { ProfileSelector } from './pages/ProfileSelector';
import { Home }            from './pages/Home';
import { Meals }           from './pages/Meals';
import { Challenges }      from './pages/Challenges';
import { Progress }        from './pages/Progress';
import { Settings }        from './pages/Settings';

function AppRoutes() {
  const { user, chargement, chargerUser, chargerJournee } = useStore();
  const nombreUtilisateurs = useLiveQuery(() => db.users.count(), []) ?? null;

  useEffect(() => {
    seedDemoData().then(() => {
      chargerUser().then(() => {
        if (localStorage.getItem('fitchallenge_userId')) {
          chargerJournee();
        }
      });
    });
  }, []);

  useEffect(() => {
    if (user?.themeSombre) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.themeSombre]);

  // Vérification des rappels à chaque ouverture de l'app
  useEffect(() => {
    if (!user?.id || !('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const heureActuelle = format(now, 'HH:mm');
    const todayStr = format(now, 'yyyy-MM-dd');

    const check = async () => {
      // Rappel repas
      if (user.notifRepasActif && user.notifRepasHeure && heureActuelle >= user.notifRepasHeure) {
        const cleLS = `notif_repas_${todayStr}`;
        if (!localStorage.getItem(cleLS)) {
          const count = await db.repas.where('userId').equals(user.id!).and((r) => r.date === todayStr).count();
          if (count === 0) {
            new Notification('FitChallenge 🍽️', {
              body: "N'oubliez pas de saisir vos repas du jour !",
              icon: '/icon-192.png',
            });
            localStorage.setItem(cleLS, '1');
          }
        }
      }

      // Rappel pesée
      if (user.notifPeseeActif && user.notifPeseeHeure && heureActuelle >= user.notifPeseeHeure) {
        const cleLS = `notif_pesee_${todayStr}`;
        if (!localStorage.getItem(cleLS)) {
          const pesees = await db.pesees.where('userId').equals(user.id!).sortBy('date');
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

  if (chargement || nombreUtilisateurs === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">💪</div>
        <p className="text-white font-bold text-2xl">FitChallenge</p>
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (nombreUtilisateurs === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/profils" element={<ProfileSelector />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/profils" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/repas"       element={<Meals />} />
      <Route path="/challenges"  element={<Challenges />} />
      <Route path="/progression" element={<Progress />} />
      <Route path="/reglages"    element={<Settings />} />
      <Route path="/profils"     element={<ProfileSelector />} />
      <Route path="/onboarding"  element={<Onboarding />} />
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

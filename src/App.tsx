import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
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

  if (chargement || nombreUtilisateurs === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">💪</div>
        <p className="text-white font-bold text-2xl">FitChallenge</p>
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Aucun profil → onboarding
  if (nombreUtilisateurs === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Profils existants mais aucun actif → sélecteur
  if (!user) {
    return (
      <Routes>
        <Route path="/profils" element={<ProfileSelector />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/profils" replace />} />
      </Routes>
    );
  }

  // Profil actif → app complète
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

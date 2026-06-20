import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { seedDemoData } from './db/seed';
import { Onboarding }  from './pages/Onboarding';
import { Home }        from './pages/Home';
import { Meals }       from './pages/Meals';
import { Challenges }  from './pages/Challenges';
import { Progress }    from './pages/Progress';
import { Settings }    from './pages/Settings';

export default function App() {
  const { user, chargement, chargerUser, chargerJournee } = useStore();

  useEffect(() => {
    // Insère les données de démo au premier lancement, puis charge le profil
    seedDemoData().then(() => {
      chargerUser().then(() => chargerJournee());
    });
  }, []);

  // Applique le thème sombre selon les préférences sauvegardées
  useEffect(() => {
    if (user?.themeSombre) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.themeSombre]);

  if (chargement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">💪</div>
        <p className="text-white font-bold text-2xl">FitChallenge</p>
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding si pas de profil */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Redirige vers l'onboarding si l'utilisateur n'est pas configuré */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/onboarding" replace />} />
        <Route path="/repas"       element={user ? <Meals />      : <Navigate to="/onboarding" replace />} />
        <Route path="/challenges"  element={user ? <Challenges /> : <Navigate to="/onboarding" replace />} />
        <Route path="/progression" element={user ? <Progress />   : <Navigate to="/onboarding" replace />} />
        <Route path="/reglages"    element={user ? <Settings />   : <Navigate to="/onboarding" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

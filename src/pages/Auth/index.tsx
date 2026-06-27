import { useState } from 'react';
import { Dumbbell, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    setMessage(null);

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErreur(error.message);
      } else {
        setMessage('Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.');
        setMode('login');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErreur('Email ou mot de passe incorrect.');
      }
      // Si succès : onAuthStateChange dans App.tsx gère la redirection
    }
    setChargement(false);
  };

  const changerMode = (m: 'login' | 'register') => {
    setMode(m);
    setErreur(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10 text-white">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Dumbbell size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">FitChallenge</h1>
          <p className="text-green-100 mt-2 font-medium">Ton coach fitness personnel</p>
        </div>

        {/* Carte */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl">
          {/* Onglets */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => changerMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className="input pl-9"
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className="input pl-9 pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Minimum 6 caractères' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {erreur && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                {erreur}
              </div>
            )}

            {/* Message succès */}
            {message && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-sm text-green-700 dark:text-green-400">
                {message}
              </div>
            )}

            <Button pleine taille="lg" type="submit" disabled={chargement}>
              {chargement
                ? 'Chargement…'
                : mode === 'login'
                ? 'Se connecter'
                : 'Créer mon compte'}
            </Button>
          </form>
        </div>

        <p className="text-center text-green-200 text-xs mt-6">
          Tes données sont chiffrées et sauvegardées dans le cloud
        </p>
      </div>
    </div>
  );
}

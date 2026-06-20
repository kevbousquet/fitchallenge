import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TOUS_LES_CHALLENGES } from '../../utils/challenges';
import { calculerObjectifCalories } from '../../utils/bmr';
import { db } from '../../db/database';
import type { ChallengeId } from '../../types';

export function Settings() {
  const { user, sauvegarderUser, chargerUser } = useStore();

  // Formulaire local (pré-rempli avec les données utilisateur)
  const [prenom, setPrenom]               = useState(user?.prenom ?? '');
  const [sexe, setSexe]                   = useState(user?.sexe ?? 'homme');
  const [age, setAge]                     = useState(String(user?.age ?? ''));
  const [taille, setTaille]               = useState(String(user?.taille ?? ''));
  const [poidsObjectif, setPoidsObjectif] = useState(String(user?.poidsObjectif ?? ''));
  const [objectifCal, setObjectifCal]     = useState(user?.objectifCalories ?? 1700);
  const [objectifPas, setObjectifPas]     = useState(user?.objectifPas ?? 8000);
  const [objectifVerres, setObjectifVerres] = useState(user?.objectifVerres ?? 8);
  const [challenges, setChallenges]       = useState<ChallengeId[]>(user?.challengesActifs ?? []);
  const [themeSombre, setThemeSombre]     = useState(user?.themeSombre ?? false);
  const [messageSauvegarde, setMessageSauvegarde] = useState(false);

  // Applique le thème sombre sur le DOM
  useEffect(() => {
    if (themeSombre) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeSombre]);

  const recalculer = () => {
    if (!age || !taille) return;
    const obj = calculerObjectifCalories(
      sexe as 'homme' | 'femme',
      user?.poidsInitial ?? 80,
      parseFloat(taille),
      parseInt(age),
    );
    setObjectifCal(Math.max(obj, 1200));
  };

  const toggleChallenge = (id: ChallengeId) => {
    setChallenges((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const sauvegarder = async () => {
    if (!user) return;
    await sauvegarderUser({
      ...user,
      prenom,
      sexe: sexe as 'homme' | 'femme',
      age: parseInt(age),
      taille: parseFloat(taille),
      poidsObjectif: parseFloat(poidsObjectif),
      objectifCalories: objectifCal,
      objectifPas,
      objectifVerres,
      challengesActifs: challenges,
      themeSombre,
    });
    setMessageSauvegarde(true);
    setTimeout(() => setMessageSauvegarde(false), 2500);
  };

  // Export JSON
  const exporterDonnees = async () => {
    const [users, repas, journees, pesees, badges] = await Promise.all([
      db.users.toArray(),
      db.repas.toArray(),
      db.journees.toArray(),
      db.pesees.toArray(),
      db.badges.toArray(),
    ]);
    const blob = new Blob(
      [JSON.stringify({ users, repas, journees, pesees, badges }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitchallenge_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset complet (dangereux)
  const resetApp = async () => {
    if (!confirm('Supprimer TOUTES les données ? Cette action est irréversible.')) return;
    await Promise.all([
      db.users.clear(),
      db.repas.clear(),
      db.journees.clear(),
      db.pesees.clear(),
      db.badges.clear(),
    ]);
    window.location.reload();
  };

  if (!user) return null;

  return (
    <Layout titre="Profil & Réglages">
      {/* Infos personnelles */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Profil</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Prénom</label>
            <input className="input" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          </div>
          <div>
            <label className="label">Sexe</label>
            <div className="flex gap-2">
              {(['homme', 'femme'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSexe(s)}
                  className={`flex-1 py-2.5 rounded-2xl border-2 font-medium text-sm transition-all ${
                    sexe === s ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}
                >
                  {s === 'homme' ? '♂ Homme' : '♀ Femme'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Âge</label>
              <input className="input" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="label">Taille (cm)</label>
              <input className="input" type="number" value={taille} onChange={(e) => setTaille(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Poids objectif (kg)</label>
            <input className="input" type="number" step="0.1" value={poidsObjectif} onChange={(e) => setPoidsObjectif(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Objectif calorique */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Objectif calorique</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Calories / jour</label>
            <input
              className="input text-xl font-bold"
              type="number"
              step="50"
              min="1000"
              max="4000"
              value={objectifCal}
              onChange={(e) => setObjectifCal(parseInt(e.target.value))}
            />
          </div>
          <Button variante="secondary" taille="sm" onClick={recalculer} className="mb-1">
            Recalculer
          </Button>
        </div>
      </Card>

      {/* Objectifs paramétrables */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Objectifs quotidiens</h3>
        <div className="space-y-3">
          <div>
            <label className="label">👣 Objectif de pas</label>
            <input
              className="input"
              type="number"
              step="500"
              min="1000"
              max="30000"
              value={objectifPas}
              onChange={(e) => setObjectifPas(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="label">💧 Objectif verres d'eau</label>
            <input
              className="input"
              type="number"
              min="4"
              max="20"
              value={objectifVerres}
              onChange={(e) => setObjectifVerres(parseInt(e.target.value))}
            />
          </div>
        </div>
      </Card>

      {/* Challenges actifs */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Challenges actifs</h3>
        <div className="space-y-2">
          {TOUS_LES_CHALLENGES.map((c) => {
            const actif = challenges.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleChallenge(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                  actif
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className={`flex-1 text-sm font-medium ${actif ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  {c.label}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${actif ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                  {actif && '✓'}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Apparence */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Apparence</h3>
        <button
          onClick={() => setThemeSombre(!themeSombre)}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
            themeSombre ? 'border-gray-600 bg-gray-800' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{themeSombre ? '🌙' : '☀️'}</span>
            <span className={`font-medium text-sm ${themeSombre ? 'text-gray-200' : 'text-gray-700'}`}>
              Mode {themeSombre ? 'sombre' : 'clair'}
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${themeSombre ? 'bg-green-500' : 'bg-gray-200'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${themeSombre ? 'left-6' : 'left-0.5'}`} />
          </div>
        </button>
      </Card>

      {/* Bouton sauvegarder */}
      <Button pleine taille="lg" onClick={sauvegarder}>
        {messageSauvegarde ? '✅ Sauvegardé !' : '💾 Sauvegarder les modifications'}
      </Button>

      {/* Données */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Données</h3>
        <div className="space-y-2">
          <Button variante="secondary" pleine onClick={exporterDonnees}>
            📤 Exporter mes données (JSON)
          </Button>
          <Button variante="danger" pleine onClick={resetApp}>
            🗑️ Réinitialiser l'application
          </Button>
        </div>
      </Card>

      <div className="text-center text-xs text-gray-400 pb-4">
        FitChallenge v0.1 · Toutes les données sont stockées sur cet appareil uniquement
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { calculerObjectifCalories } from '../../utils/bmr';
import { TOUS_LES_CHALLENGES } from '../../utils/challenges';
import { Button } from '../../components/ui/Button';
import type { ChallengeId, User } from '../../types';

type Etape = 'profil' | 'calories' | 'challenges' | 'termine';

export function Onboarding() {
  const navigate = useNavigate();
  const { sauvegarderUser } = useStore();

  const [etape, setEtape] = useState<Etape>('profil');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<'homme' | 'femme'>('homme');
  const [age, setAge] = useState('');
  const [taille, setTaille] = useState('');
  const [poidsActuel, setPoidsActuel] = useState('');
  const [poidsObjectif, setPoidsObjectif] = useState('');
  const [dateCible, setDateCible] = useState('');
  const [objectifCalories, setObjectifCalories] = useState(1700);
  const [challengesActifs, setChallengesActifs] = useState<ChallengeId[]>([
    'deficit_calorique', 'pas', 'sport', 'hydratation', 'sommeil',
  ]);

  const calculerEtProposer = () => {
    const obj = calculerObjectifCalories(
      sexe,
      parseFloat(poidsActuel),
      parseFloat(taille),
      parseInt(age),
    );
    setObjectifCalories(Math.max(obj, 1200)); // minimum 1200 kcal
    setEtape('calories');
  };

  const toggleChallenge = (id: ChallengeId) => {
    setChallengesActifs((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const terminer = async () => {
    const user: User = {
      prenom,
      sexe,
      age: parseInt(age),
      taille: parseFloat(taille),
      poidsInitial: parseFloat(poidsActuel),
      poidsObjectif: parseFloat(poidsObjectif),
      dateCible: dateCible || undefined,
      objectifCalories,
      objectifPas: 8000,
      objectifVerres: 8,
      challengesActifs,
      themeSombre: false,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    await sauvegarderUser(user);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-500 flex flex-col">
      {/* En-tête */}
      <div className="px-6 pt-16 pb-8 text-white">
        <h1 className="text-4xl font-black tracking-tight">FitChallenge</h1>
        <p className="text-green-100 mt-1 text-lg">
          {etape === 'profil'      && 'Parlez-nous de vous'}
          {etape === 'calories'    && 'Votre objectif calorique'}
          {etape === 'challenges'  && 'Vos challenges quotidiens'}
          {etape === 'termine'     && "C'est parti !"}
        </p>
        {/* Indicateur d'étapes */}
        <div className="flex gap-2 mt-4">
          {(['profil', 'calories', 'challenges'] as Etape[]).map((e, i) => (
            <div
              key={e}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                ['profil', 'calories', 'challenges'].indexOf(etape) >= i
                  ? 'bg-white'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Carte de contenu */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-t-3xl px-6 py-8 overflow-y-auto">

        {/* ── Étape 1 : Profil ── */}
        {etape === 'profil' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="label">Prénom</label>
              <input
                className="input"
                placeholder="Votre prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Sexe</label>
              <div className="flex gap-3">
                {(['homme', 'femme'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSexe(s)}
                    className={`flex-1 py-3 rounded-2xl border-2 font-semibold transition-all ${
                      sexe === s
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {s === 'homme' ? '♂ Homme' : '♀ Femme'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Âge</label>
                <input className="input" type="number" placeholder="32" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div>
                <label className="label">Taille (cm)</label>
                <input className="input" type="number" placeholder="175" value={taille} onChange={(e) => setTaille(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Poids actuel (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="85.0" value={poidsActuel} onChange={(e) => setPoidsActuel(e.target.value)} />
              </div>
              <div>
                <label className="label">Poids objectif (kg)</label>
                <input className="input" type="number" step="0.1" placeholder="75.0" value={poidsObjectif} onChange={(e) => setPoidsObjectif(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Date cible (optionnelle)</label>
              <input className="input" type="date" value={dateCible} onChange={(e) => setDateCible(e.target.value)} />
            </div>

            <Button
              pleine
              taille="lg"
              onClick={calculerEtProposer}
              disabled={!prenom || !age || !taille || !poidsActuel || !poidsObjectif}
            >
              Suivant →
            </Button>
          </div>
        )}

        {/* ── Étape 2 : Calories ── */}
        {etape === 'calories' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Objectif calculé par la formule Mifflin-St Jeor
              </p>
              <p className="text-5xl font-black text-green-600 dark:text-green-400 mt-2">
                {objectifCalories}
              </p>
              <p className="text-green-600 dark:text-green-400 font-medium">kcal / jour</p>
              <p className="text-xs text-gray-500 mt-2">
                Pour perdre environ 0,5 kg/semaine avec un niveau d'activité modéré
              </p>
            </div>

            <div>
              <label className="label">Ajuster manuellement (kcal)</label>
              <input
                className="input text-center text-2xl font-bold"
                type="number"
                step="50"
                min="1000"
                max="3500"
                value={objectifCalories}
                onChange={(e) => setObjectifCalories(parseInt(e.target.value))}
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3 text-xs text-amber-700 dark:text-amber-300">
              💡 Minimum recommandé : 1200 kcal pour les femmes, 1500 kcal pour les hommes.
              Consultez un médecin avant de vous fixer un objectif très restrictif.
            </div>

            <div className="flex gap-3">
              <Button variante="secondary" onClick={() => setEtape('profil')}>← Retour</Button>
              <Button pleine taille="lg" onClick={() => setEtape('challenges')}>Suivant →</Button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Challenges ── */}
        {etape === 'challenges' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Sélectionnez les challenges que vous voulez suivre chaque jour. Vous pourrez les modifier plus tard.
            </p>

            <div className="space-y-2">
              {TOUS_LES_CHALLENGES.map((c) => {
                const actif = challengesActifs.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleChallenge(c.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      actif
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${actif ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {c.label}
                      </p>
                      <p className="text-xs text-gray-400">{c.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      actif ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                    }`}>
                      {actif && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variante="secondary" onClick={() => setEtape('calories')}>← Retour</Button>
              <Button pleine taille="lg" onClick={terminer} disabled={challengesActifs.length === 0}>
                Démarrer 🚀
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

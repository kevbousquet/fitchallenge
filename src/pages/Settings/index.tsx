import { useState, useEffect } from 'react';
import {
  Footprints, Droplets, Bell, BellOff, UtensilsCrossed, Scale, Moon, Sun,
  Check, Save, User, Upload, Trash2, Target, Dumbbell, Ban, Wine, Candy,
  Leaf, ChevronRight, Activity,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TOUS_LES_CHALLENGES } from '../../utils/challenges';
import { calculerObjectifCalories } from '../../utils/bmr';
import { exporterToutesDonnees, supprimerToutesDonnees } from '../../lib/db';
import {
  getClientId, setClientId,
  isConnecte as gfitConnecteCheck,
  connecter as connecterGfit,
  deconnecter as deconnecterGfit,
} from '../../services/googleFit';
import type { ChallengeId } from '../../types';

type IconComp = React.ComponentType<{ size?: number; className?: string }>;

const CHALLENGE_ICONS: Record<ChallengeId, IconComp> = {
  deficit_calorique: Target,
  pas:               Footprints,
  sport:             Dumbbell,
  hydratation:       Droplets,
  sommeil:           Moon,
  pas_de_grignotage: Ban,
  pas_alcool:        Wine,
  pas_sucre:         Candy,
  legumes:           Leaf,
};

export function Settings() {
  const { user, sauvegarderUser, deconnecterProfil } = useStore();

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

  const [notifRepasActif, setNotifRepasActif]   = useState(user?.notifRepasActif ?? false);
  const [notifRepasHeure, setNotifRepasHeure]   = useState(user?.notifRepasHeure ?? '20:00');
  const [notifPeseeActif, setNotifPeseeActif]   = useState(user?.notifPeseeActif ?? false);
  const [notifPeseeHeure, setNotifPeseeHeure]   = useState(user?.notifPeseeHeure ?? '08:00');
  const [permissionNotif, setPermissionNotif]   = useState<NotificationPermission>('default');

  const [messageSauvegarde, setMessageSauvegarde] = useState(false);

  // Google Fit
  const [gfitClientId, setGfitClientId] = useState(getClientId());
  const [gfitConnecte, setGfitConnecte] = useState(gfitConnecteCheck());
  const [gfitConnexionEnCours, setGfitConnexionEnCours] = useState(false);

  const connecterGoogleFit = async () => {
    if (!gfitClientId) return;
    setClientId(gfitClientId);
    setGfitConnexionEnCours(true);
    const ok = await connecterGfit(gfitClientId);
    setGfitConnexionEnCours(false);
    setGfitConnecte(ok);
  };

  const deconnecterGoogleFit = () => {
    deconnecterGfit();
    setGfitConnecte(false);
  };

  useEffect(() => {
    if ('Notification' in window) setPermissionNotif(Notification.permission);
  }, []);

  useEffect(() => {
    if (themeSombre) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeSombre]);

  const demanderPermissionNotif = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setPermissionNotif(perm);
  };

  const recalculer = () => {
    if (!age || !taille) return;
    const obj = calculerObjectifCalories(sexe as 'homme' | 'femme', user?.poidsInitial ?? 80, parseFloat(taille), parseInt(age));
    setObjectifCal(Math.max(obj, 1200));
  };

  const toggleChallenge = (id: ChallengeId) => {
    setChallenges((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const sauvegarder = async () => {
    if (!user) return;
    await sauvegarderUser({
      ...user,
      prenom, sexe: sexe as 'homme' | 'femme',
      age: parseInt(age), taille: parseFloat(taille),
      poidsObjectif: parseFloat(poidsObjectif),
      objectifCalories: objectifCal, objectifPas, objectifVerres,
      challengesActifs: challenges, themeSombre,
      notifRepasActif, notifRepasHeure,
      notifPeseeActif, notifPeseeHeure,
    });
    setMessageSauvegarde(true);
    setTimeout(() => setMessageSauvegarde(false), 2500);
  };

  const exporterDonnees = async () => {
    if (!user?.id) return;
    const donnees = await exporterToutesDonnees(user.id);
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitchallenge_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetApp = async () => {
    if (!confirm('Supprimer TOUTES les données ? Cette action est irréversible.')) return;
    if (!user?.id) return;
    await supprimerToutesDonnees(user.id);
    await deconnecterProfil();
  };

  if (!user) return null;

  const Toggle = ({ actif, onToggle }: { actif: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${actif ? 'bg-green-500' : 'bg-slate-200 dark:bg-gray-700'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${actif ? 'left-6' : 'left-0.5'}`} />
    </button>
  );

  return (
    <Layout titre="Profil & Réglages">
      {/* Infos personnelles */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Profil</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Prénom</label>
            <input className="input" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          </div>
          <div>
            <label className="label">Sexe</label>
            <div className="flex gap-2">
              {(['homme', 'femme'] as const).map((s) => (
                <button key={s} onClick={() => setSexe(s)} className={`flex-1 py-2.5 rounded-2xl border-2 font-medium text-sm transition-all ${sexe === s ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-slate-200 dark:border-gray-700 text-slate-500'}`}>
                  {s === 'homme' ? 'Homme' : 'Femme'}
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
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Objectif calorique</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">Calories / jour</label>
            <input className="input text-xl font-bold" type="number" step="50" min="1000" max="4000" value={objectifCal} onChange={(e) => setObjectifCal(parseInt(e.target.value))} />
          </div>
          <Button variante="secondary" taille="sm" onClick={recalculer} className="mb-1">Recalculer</Button>
        </div>
      </Card>

      {/* Objectifs quotidiens */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Objectifs quotidiens</h3>
        <div className="space-y-3">
          <div>
            <label className="label flex items-center gap-1.5">
              <Footprints size={13} className="text-slate-400" /> Objectif de pas
            </label>
            <input className="input" type="number" step="500" min="1000" max="30000" value={objectifPas} onChange={(e) => setObjectifPas(parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Droplets size={13} className="text-slate-400" /> Objectif verres d'eau
            </label>
            <input className="input" type="number" min="4" max="20" value={objectifVerres} onChange={(e) => setObjectifVerres(parseInt(e.target.value))} />
          </div>
        </div>
      </Card>

      {/* Rappels / Notifications */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Rappels</h3>

        {permissionNotif !== 'granted' && (
          <button
            onClick={demanderPermissionNotif}
            className="w-full mb-4 py-2.5 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-semibold border border-green-200 dark:border-green-700 flex items-center justify-center gap-2"
          >
            <Bell size={15} /> Activer les notifications
          </button>
        )}
        {permissionNotif === 'denied' && (
          <div className="flex items-start gap-2 mb-3">
            <BellOff size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-500">Les notifications sont bloquées. Autorisez-les dans les réglages de votre navigateur.</p>
          </div>
        )}

        <div className="space-y-4">
          <div className={`space-y-2 ${permissionNotif !== 'granted' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <UtensilsCrossed size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Rappel repas</p>
                  <p className="text-xs text-slate-400">Si aucun repas saisi dans la journée</p>
                </div>
              </div>
              <Toggle actif={notifRepasActif} onToggle={() => setNotifRepasActif(!notifRepasActif)} />
            </div>
            {notifRepasActif && (
              <input type="time" className="input" value={notifRepasHeure} onChange={(e) => setNotifRepasHeure(e.target.value)} />
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-gray-800" />

          <div className={`space-y-2 ${permissionNotif !== 'granted' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <Scale size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Rappel pesée</p>
                  <p className="text-xs text-slate-400">Si pas de pesée depuis 3 jours</p>
                </div>
              </div>
              <Toggle actif={notifPeseeActif} onToggle={() => setNotifPeseeActif(!notifPeseeActif)} />
            </div>
            {notifPeseeActif && (
              <input type="time" className="input" value={notifPeseeHeure} onChange={(e) => setNotifPeseeHeure(e.target.value)} />
            )}
          </div>
        </div>
      </Card>

      {/* Challenges actifs */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Challenges actifs</h3>
        <div className="space-y-2">
          {TOUS_LES_CHALLENGES.map((c) => {
            const actif = challenges.includes(c.id);
            const CIcon = CHALLENGE_ICONS[c.id];
            return (
              <button key={c.id} onClick={() => toggleChallenge(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${actif ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-100 dark:border-gray-700'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${actif ? 'bg-green-600' : 'bg-slate-100 dark:bg-gray-800'}`}>
                  <CIcon size={15} className={actif ? 'text-white' : 'text-slate-400'} />
                </div>
                <span className={`flex-1 text-sm font-medium ${actif ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>{c.label}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${actif ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                  {actif && <Check size={11} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Apparence */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Apparence</h3>
        <button onClick={() => setThemeSombre(!themeSombre)} className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${themeSombre ? 'border-gray-600 bg-gray-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            {themeSombre
              ? <Moon size={20} className="text-indigo-400" />
              : <Sun size={20} className="text-amber-500" />
            }
            <span className={`font-medium text-sm ${themeSombre ? 'text-slate-200' : 'text-slate-700'}`}>
              Mode {themeSombre ? 'sombre' : 'clair'}
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${themeSombre ? 'bg-green-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${themeSombre ? 'left-6' : 'left-0.5'}`} />
          </div>
        </button>
      </Card>

      {/* Google Fit */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-green-600" />
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Google Fit</h3>
        </div>
        {gfitConnecte ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <Check size={14} className="text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">Connecté à Google Fit</span>
            </div>
            <p className="text-xs text-slate-400">Votre nombre de pas peut être importé depuis Google Fit sur l'accueil.</p>
            <Button variante="secondary" pleine onClick={deconnecterGoogleFit}>
              Se déconnecter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Importez automatiquement votre nombre de pas depuis Google Fit. Vous aurez besoin d'un Client ID OAuth créé dans Google Cloud Console.
            </p>
            <div>
              <label className="label">Client ID Google OAuth</label>
              <input
                className="input text-xs"
                placeholder="xxxx.apps.googleusercontent.com"
                value={gfitClientId}
                onChange={(e) => setGfitClientId(e.target.value)}
              />
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                console.cloud.google.com → API et services → Identifiants → OAuth 2.0
              </p>
            </div>
            <Button pleine onClick={connecterGoogleFit} disabled={!gfitClientId || gfitConnexionEnCours}>
              {gfitConnexionEnCours ? 'Connexion en cours…' : 'Se connecter'}
            </Button>
          </div>
        )}
      </Card>

      {/* Sauvegarder */}
      <Button pleine taille="lg" onClick={sauvegarder}>
        {messageSauvegarde
          ? <><Check size={16} /> Sauvegardé !</>
          : <><Save size={16} /> Sauvegarder les modifications</>
        }
      </Button>

      {/* Profils */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Profils</h3>
        <button
          onClick={async () => { await deconnecterProfil(); }}
          className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Se déconnecter</span>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </button>
      </Card>

      {/* Données */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Données</h3>
        <div className="space-y-2">
          <Button variante="secondary" pleine onClick={exporterDonnees}>
            <Upload size={15} /> Exporter mes données (JSON)
          </Button>
          <Button variante="danger" pleine onClick={resetApp}>
            <Trash2 size={15} /> Réinitialiser l'application
          </Button>
        </div>
      </Card>

      <div className="text-center text-xs text-slate-400 pb-4">
        FitChallenge v0.2 · Données sauvegardées dans le cloud
      </div>
    </Layout>
  );
}

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDbQuery } from '../../hooks/useDbQuery';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import {
  Target, Footprints, Dumbbell, Droplets, Moon, Ban, Wine, Candy, Salad,
  Camera, Pencil, Star, Plus, Check, Flame, Sunrise, Sun, Sunset, Apple,
  ChevronRight, Trash2, ScanLine, RefreshCw, Search, X,
} from 'lucide-react';
import { getRepasParDate, getToutesJournees, ajouterRepas as addRepas, ajouterFavori, supprimerFavori, getFavoris } from '../../lib/db';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CircularGauge } from '../../components/ui/CircularGauge';
import { Modal } from '../../components/ui/Modal';
import { CHALLENGES } from '../../utils/challenges';
import { calculerStreak } from '../../utils/streak';
import { useStepCounter } from '../../hooks/useStepCounter';
import { analyserRepasParPhoto, fileToBase64 } from '../../services/claudeApi';
import { MacroBar } from '../../components/ui/MacroBar';
import { calculerObjectifsMacros, OBJECTIF_LABELS } from '../../utils/macros';
import { rechercherParCode } from '../../services/openFoodFacts';
import type { ProduitOFF } from '../../services/openFoodFacts';
import { INGREDIENTS, CATEGORIE_LABELS, CATEGORIE_COLORS } from '../../data/ingredients';
import type { Ingredient } from '../../data/ingredients';
import { calculerCaloriesBrulees } from '../../utils/caloriesBrulees';
import { isConnecte, recupererPasAujourdhui, recupererCaloriesAujourdhui } from '../../services/googleFit';
import type { Repas, AnalyseRepas, ChallengeId, CategoriRepas, FavoriRepas } from '../../types';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const CATS: { id: CategoriRepas; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string }[] = [
  { id: 'petit_dejeuner', Icon: Sunrise, label: 'Matin',  color: 'text-amber-500' },
  { id: 'dejeuner',       Icon: Sun,     label: 'Midi',   color: 'text-orange-500' },
  { id: 'diner',          Icon: Sunset,  label: 'Soir',   color: 'text-indigo-500' },
  { id: 'collation',      Icon: Apple,   label: 'Snack',  color: 'text-green-600' },
];

const CHALLENGE_ICONS: Record<ChallengeId, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  deficit_calorique: Target,
  pas:               Footprints,
  sport:             Dumbbell,
  hydratation:       Droplets,
  sommeil:           Moon,
  pas_de_grignotage: Ban,
  pas_alcool:        Wine,
  pas_sucre:         Candy,
  legumes:           Salad,
};

function devinerCategorie(): CategoriRepas {
  const h = new Date().getHours();
  if (h >= 5 && h < 10)  return 'petit_dejeuner';
  if (h >= 11 && h < 15) return 'dejeuner';
  if (h >= 19 && h < 23) return 'diner';
  return 'collation';
}

export function Home() {
  const { user, journeeAujourdhui, mettreAJourJournee } = useStore();
  const userId = user?.id ?? '';

  const repasAujourdhui = useDbQuery(
    () => userId ? getRepasParDate(userId, TODAY) : Promise.resolve([] as Repas[]),
    [] as Repas[],
    [userId],
  );
  const toutesJournees = useDbQuery(
    () => userId ? getToutesJournees(userId) : Promise.resolve([] as import('../../types').Journee[]),
    [] as import('../../types').Journee[],
    [userId],
  );

  const streak = calculerStreak(toutesJournees);
  const caloriesConsommees = repasAujourdhui.reduce((s, r) => s + r.calories, 0);
  const objectifCal = user?.objectifCalories ?? 1800;
  const depenseCaloriques = calculerCaloriesBrulees(journeeAujourdhui ?? null, user);

  const [modalRepas, setModalRepas] = useState(false);
  const [modalSport, setModalSport] = useState(false);
  const [typeSport, setTypeSport] = useState<'cardio' | 'musculation' | 'marche' | 'autre'>('cardio');
  const [dureeSport, setDureeSport] = useState('30');

  const lancerConfettis = () =>
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#16a34a', '#0d9488', '#86efac'] });

  const validerSport = async () => {
    await mettreAJourJournee({ sportFait: true, typeSport, dureeSport: parseInt(dureeSport) });
    setModalSport(false);
    lancerConfettis();
  };

  const basculeCheck = async (id: ChallengeId) => {
    if (!journeeAujourdhui) return;
    const map: Record<string, keyof typeof journeeAujourdhui> = {
      sommeil: 'sommeilOk', pas_de_grignotage: 'pasDeGrignotage',
      pas_alcool: 'pasDAlcool', pas_sucre: 'pasDeSucre', legumes: 'legumesMange',
    };
    const champ = map[id];
    if (!champ) return;
    const etaitCoche = journeeAujourdhui[champ] as boolean;
    await mettreAJourJournee({ [champ]: !etaitCoche });
    if (!etaitCoche) lancerConfettis();
  };

  const handleSport = () => {
    if (journeeAujourdhui?.sportFait) {
      mettreAJourJournee({ sportFait: false, typeSport: undefined, dureeSport: undefined });
    } else {
      setModalSport(true);
    }
  };

  const ajouterVerre = async () => {
    const v = (journeeAujourdhui?.verresBus ?? 0) + 1;
    await mettreAJourJournee({ verresBus: v });
    if (v >= (user?.objectifVerres ?? 8)) lancerConfettis();
  };

  const [pasInput, setPasInput] = useState('');
  const saisirPas = async () => {
    const n = parseInt(pasInput);
    if (!isNaN(n)) {
      await mettreAJourJournee({ pas: n });
      setPasInput('');
      if (n >= (user?.objectifPas ?? 8000)) lancerConfettis();
    }
  };

  // Auto step counter
  const pasBaseRef = useRef(0);
  const [nouveauPas, setNouveauPas] = useState(0);
  const nouveauPasRef = useRef(0);

  const onNouveauPas = useCallback((total: number) => {
    nouveauPasRef.current = total;
    setNouveauPas(total);
  }, []);

  const stepCounter = useStepCounter(onNouveauPas);

  // Auto-save every 10 seconds while counter is active
  useEffect(() => {
    if (!stepCounter.actif) return;
    const interval = setInterval(async () => {
      if (nouveauPasRef.current > 0) {
        const total = pasBaseRef.current + nouveauPasRef.current;
        await mettreAJourJournee({ pas: total });
        if (total >= (user?.objectifPas ?? 8000)) lancerConfettis();
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [stepCounter.actif, user?.objectifPas]);

  const demarrerCompteurPas = async () => {
    pasBaseRef.current = journeeAujourdhui?.pas ?? 0;
    setNouveauPas(0);
    nouveauPasRef.current = 0;
    await stepCounter.demarrer();
  };

  const arreterCompteurPas = async () => {
    stepCounter.arreter();
    const total = pasBaseRef.current + nouveauPasRef.current;
    if (nouveauPasRef.current > 0) {
      await mettreAJourJournee({ pas: total });
      if (total >= (user?.objectifPas ?? 8000)) lancerConfettis();
    }
    setNouveauPas(0);
  };

  // Google Fit sync — pas
  const [gfitSync, setGfitSync] = useState(false);
  const syncDepuisGoogleFit = async () => {
    setGfitSync(true);
    const pas = await recupererPasAujourdhui();
    setGfitSync(false);
    if (pas !== null) {
      await mettreAJourJournee({ pas });
      if (pas >= (user?.objectifPas ?? 8000)) lancerConfettis();
    }
  };

  // Calories montre
  const [montreInput, setMontreInput] = useState('');
  const [gfitCalSync, setGfitCalSync] = useState(false);

  const saisirCaloriesMontre = async () => {
    const n = parseInt(montreInput);
    if (!isNaN(n) && n > 0) {
      await mettreAJourJournee({ caloriesMontre: n });
      setMontreInput('');
    }
  };

  const syncCaloriesGoogleFit = async () => {
    setGfitCalSync(true);
    const cal = await recupererCaloriesAujourdhui();
    setGfitCalSync(false);
    if (cal !== null) await mettreAJourJournee({ caloriesMontre: cal });
  };

  const renderChallenge = (id: ChallengeId) => {
    const c = CHALLENGES[id];
    const Icon = CHALLENGE_ICONS[id];
    if (!c || !journeeAujourdhui || !user) return null;

    let estCoche = false;
    let contenu: React.ReactNode = null;

    switch (id) {
      case 'deficit_calorique':
        estCoche = caloriesConsommees <= objectifCal && caloriesConsommees > 0;
        contenu = (
          <span className="text-xs text-slate-400 tabular-nums">
            {caloriesConsommees} / {objectifCal} kcal
          </span>
        );
        break;
      case 'pas': {
        const totalPas = stepCounter.actif
          ? pasBaseRef.current + nouveauPas
          : journeeAujourdhui.pas;
        estCoche = totalPas >= user.objectifPas;
        contenu = (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 tabular-nums">
                {totalPas.toLocaleString('fr')} / {user.objectifPas.toLocaleString('fr')}
              </span>
              {stepCounter.actif && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  En cours
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!stepCounter.actif ? (
                <>
                  <button
                    onClick={demarrerCompteurPas}
                    className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Footprints size={11} /> Comptage auto
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-0.5 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                      type="number" placeholder="ou saisir"
                      value={pasInput}
                      onChange={(e) => setPasInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saisirPas()}
                    />
                    <button onClick={saisirPas} className="text-xs text-green-600 font-bold px-1">OK</button>
                  </div>
                  {isConnecte() && (
                    <button
                      onClick={syncDepuisGoogleFit}
                      disabled={gfitSync}
                      className="text-xs bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border border-slate-200 dark:border-gray-700 disabled:opacity-50"
                    >
                      {gfitSync
                        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                        : <RefreshCw size={11} />
                      }
                      Google Fit
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={arreterCompteurPas}
                  className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 px-2.5 py-1 rounded-lg font-semibold"
                >
                  Arrêter
                </button>
              )}
            </div>
            {stepCounter.erreur && (
              <p className="text-xs text-red-400">{stepCounter.erreur}</p>
            )}
          </div>
        );
        break;
      }
      case 'sport':
        estCoche = journeeAujourdhui.sportFait;
        contenu = journeeAujourdhui.sportFait ? (
          <span className="text-xs text-slate-400 capitalize">
            {journeeAujourdhui.typeSport} · {journeeAujourdhui.dureeSport} min
          </span>
        ) : null;
        break;
      case 'hydratation':
        estCoche = journeeAujourdhui.verresBus >= user.objectifVerres;
        contenu = (
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex gap-0.5">
              {Array.from({ length: user.objectifVerres }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    i < journeeAujourdhui.verresBus ? 'bg-teal-500' : 'bg-slate-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={ajouterVerre}
              className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-lg font-semibold"
            >
              +1
            </button>
          </div>
        );
        break;
      case 'sommeil':        estCoche = journeeAujourdhui.sommeilOk;        break;
      case 'pas_de_grignotage': estCoche = journeeAujourdhui.pasDeGrignotage; break;
      case 'pas_alcool':    estCoche = journeeAujourdhui.pasDAlcool;        break;
      case 'pas_sucre':     estCoche = journeeAujourdhui.pasDeSucre;        break;
      case 'legumes':       estCoche = journeeAujourdhui.legumesMange;      break;
    }

    const clicable = !['deficit_calorique', 'pas', 'hydratation'].includes(id);

    return (
      <div
        key={id}
        onClick={clicable ? () => { if (id === 'sport') handleSport(); else basculeCheck(id); } : undefined}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
          clicable ? 'cursor-pointer active:scale-[0.98]' : ''
        } ${estCoche ? 'bg-green-50 dark:bg-green-900/15' : 'bg-slate-50 dark:bg-gray-800/50'}`}
      >
        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
          estCoche ? 'bg-green-600' : 'bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700'
        }`}>
          {estCoche
            ? <Check size={15} className="text-white" strokeWidth={2.5} />
            : <Icon size={15} className="text-slate-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-tight ${
            estCoche ? 'text-green-700 dark:text-green-300' : 'text-slate-700 dark:text-gray-300'
          }`}>
            {c.label}
          </p>
          {contenu}
        </div>
        {clicable && !estCoche && (
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        )}
      </div>
    );
  };

  return (
    <Layout
      titre={`Bonjour ${user?.prenom ?? ''}`}
      actions={
        streak > 0 ? (
          <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-lg">
            <Flame size={14} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak}</span>
          </div>
        ) : null
      }
    >
      <p className="text-sm text-slate-400 dark:text-slate-500 -mt-1 capitalize font-medium">
        {format(new Date(), 'EEEE d MMMM', { locale: fr })}
      </p>

      {/* Jauge + calories */}
      <Card className="flex flex-col items-center py-6 gap-4">
        <CircularGauge valeur={caloriesConsommees} objectif={objectifCal} />

        {/* Bilan énergétique */}
        <div className="w-full space-y-2 px-1">
          {/* Ligne dépenses */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-medium">Ingéré</span>
            <span className="font-bold text-slate-700 dark:text-gray-200 tabular-nums">{caloriesConsommees} kcal</span>
          </div>

          {/* Dépense montre ou calcul interne */}
          {depenseCaloriques.depenseMontre > 0 ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Flame size={11} className="text-orange-400" />
                Brûlé (montre)
              </span>
              <span className="font-bold text-orange-500 tabular-nums">−{depenseCaloriques.depenseMontre} kcal</span>
            </div>
          ) : depenseCaloriques.total > 0 ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Flame size={11} className="text-orange-400" />
                Brûlé (estimé)
                {depenseCaloriques.depensePas > 0 && (
                  <span className="text-slate-300 dark:text-gray-600">
                    · {journeeAujourdhui?.pas?.toLocaleString('fr')} pas
                  </span>
                )}
              </span>
              <span className="font-bold text-orange-500 tabular-nums">−{depenseCaloriques.total} kcal</span>
            </div>
          ) : null}

          {/* Saisie calories montre */}
          <div className="flex items-center gap-2 pt-1">
            <input
              className="flex-1 text-xs border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-400"
              type="number"
              placeholder={depenseCaloriques.depenseMontre > 0 ? `Montre : ${depenseCaloriques.depenseMontre} kcal` : "Calories brûlées (montre)"}
              value={montreInput}
              onChange={(e) => setMontreInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saisirCaloriesMontre()}
            />
            {montreInput && (
              <button onClick={saisirCaloriesMontre} className="text-xs text-orange-600 dark:text-orange-400 font-bold px-1">OK</button>
            )}
            {isConnecte() && (
              <button
                onClick={syncCaloriesGoogleFit}
                disabled={gfitCalSync}
                className="text-xs bg-slate-50 dark:bg-gray-800 text-slate-500 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border border-slate-200 dark:border-gray-700 disabled:opacity-50 flex-shrink-0"
              >
                {gfitCalSync
                  ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                  : <RefreshCw size={11} />
                }
                Google Fit
              </button>
            )}
          </div>

          {/* Bilan net */}
          {(() => {
            const net = caloriesConsommees - depenseCaloriques.total;
            if (depenseCaloriques.total === 0 && caloriesConsommees === 0) return null;
            const excedent = net > 0;
            return (
              <div className={`flex items-center justify-between gap-2 text-sm font-black pt-1 border-t border-slate-100 dark:border-gray-700 ${excedent ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
                <span>Bilan net</span>
                <span className="tabular-nums">{excedent ? '+' : ''}{net} kcal</span>
              </div>
            );
          })()}
        </div>

        <Button taille="md" onClick={() => setModalRepas(true)} className="gap-2">
          <Plus size={16} strokeWidth={2.5} />
          Ajouter un repas
        </Button>
      </Card>

      {/* Macros */}
      {user && (
        <Card>
          {(() => {
            const objectifs = calculerObjectifsMacros(user);
            const proteines = repasAujourdhui.reduce((s, r) => s + (r.proteines ?? 0), 0);
            const glucides  = repasAujourdhui.reduce((s, r) => s + (r.glucides  ?? 0), 0);
            const lipides   = repasAujourdhui.reduce((s, r) => s + (r.lipides   ?? 0), 0);
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-400">Macros du jour</p>
                  <span className="text-[10px] bg-slate-100 dark:bg-gray-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                    {OBJECTIF_LABELS[objectifs.objectifType]}
                  </span>
                </div>
                <div className="space-y-2">
                  <MacroBar emoji="🥩" label="Protéines" consomme={proteines} objectif={objectifs.proteines}
                    couleur="bg-blue-500" bgClair="bg-blue-50 dark:bg-blue-900/20" textColor="text-blue-600" />
                  <MacroBar emoji="🍚" label="Glucides"  consomme={glucides}  objectif={objectifs.glucides}
                    couleur="bg-amber-400" bgClair="bg-amber-50 dark:bg-amber-900/20" textColor="text-amber-600" />
                  <MacroBar emoji="🥑" label="Lipides"   consomme={lipides}   objectif={objectifs.lipides}
                    couleur="bg-rose-400" bgClair="bg-rose-50 dark:bg-rose-900/20" textColor="text-rose-500" />
                </div>
              </>
            );
          })()}
        </Card>
      )}

      {/* Challenges */}
      <Card>
        <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3">Challenges du jour</p>
        <div className="space-y-2">
          {user?.challengesActifs.map(renderChallenge)}
        </div>
        {journeeAujourdhui?.parfaite && (
          <div className="mt-3 p-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl text-white text-center">
            <p className="font-bold text-sm">Journée parfaite</p>
            <p className="text-xs text-green-100 mt-0.5">Tous les challenges accomplis</p>
          </div>
        )}
      </Card>

      {/* Aperçu repas */}
      {repasAujourdhui.length > 0 && (
        <Card>
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3">
            Repas du jour · {repasAujourdhui.length}
          </p>
          <div className="space-y-2">
            {repasAujourdhui.slice(-3).map((r) => {
              const cat = CATS.find((c) => c.id === r.categorie);
              return (
                <div key={r.id} className="flex items-center gap-3">
                  {r.photoBase64 ? (
                    <img src={`data:image/jpeg;base64,${r.photoBase64}`} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt={r.nom} />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      {cat ? <cat.Icon size={18} className={cat.color} /> : <Sun size={18} className="text-slate-400" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">{r.nom}</p>
                    <p className="text-xs text-slate-400 tabular-nums">{r.calories} kcal</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <ModalAjoutRepas ouvert={modalRepas} onFermer={() => setModalRepas(false)} userId={userId} />

      {/* Modal sport */}
      <Modal ouvert={modalSport} onFermer={() => setModalSport(false)} titre="Séance de sport">
        <div className="space-y-4">
          <div>
            <label className="label">Type de séance</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'cardio',      label: 'Cardio' },
                { id: 'musculation', label: 'Muscu' },
                { id: 'marche',      label: 'Marche' },
                { id: 'autre',       label: 'Autre' },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeSport(t.id)}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    typeSport === t.id
                      ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'border-slate-200 dark:border-gray-700 text-slate-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Durée (minutes)</label>
            <input className="input" type="number" min="5" max="300" value={dureeSport} onChange={(e) => setDureeSport(e.target.value)} />
          </div>
          <Button pleine taille="lg" onClick={validerSport}>Valider la séance</Button>
        </div>
      </Modal>
    </Layout>
  );
}

// ─── Modal ajout repas ───────────────────────────────────────────────────────
function ModalAjoutRepas({ ouvert, onFermer, userId }: { ouvert: boolean; onFermer: () => void; userId: string }) {
  const { refreshDb } = useStore();
  const [onglet, setOnglet] = useState<'photo' | 'manuel' | 'favoris' | 'scanner'>('photo');
  const [categorie, setCategorie] = useState<CategoriRepas>(devinerCategorie);
  const [nomManuel, setNomManuel] = useState('');
  const [calManuel, setCalManuel] = useState('');
  const [protManuel, setProtManuel] = useState('');
  const [glucManuel, setGlucManuel] = useState('');
  const [lipManuel, setLipManuel] = useState('');
  const [sauverFavori, setSauverFavori] = useState(false);
  const [analyse, setAnalyse] = useState<AnalyseRepas | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Ingredient composer state (Manuel tab)
  const [rechercheIng, setRechercheIng] = useState('');
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const [composition, setComposition] = useState<{ ing: Ingredient; poids: string }[]>([]);

  const suggestions = useMemo(() =>
    rechercheIng.length >= 2
      ? INGREDIENTS.filter((ing) =>
          ing.nom.toLowerCase().includes(rechercheIng.toLowerCase())
        ).slice(0, 7)
      : [],
    [rechercheIng],
  );

  const totaux = useMemo(() =>
    composition.reduce(
      (acc, item) => {
        const r = parseFloat(item.poids) / 100;
        if (!isNaN(r) && r > 0) {
          acc.calories  += Math.round(item.ing.calories100g * r);
          acc.proteines += item.ing.proteines100g * r;
          acc.glucides  += item.ing.glucides100g  * r;
          acc.lipides   += item.ing.lipides100g   * r;
        }
        return acc;
      },
      { calories: 0, proteines: 0, glucides: 0, lipides: 0 },
    ),
    [composition],
  );

  // Sync composition → form fields
  useEffect(() => {
    if (composition.length === 0) return;
    setNomManuel(composition.map((i) => i.ing.nom).join(' + '));
    setCalManuel(String(totaux.calories));
    setProtManuel(String(Math.round(totaux.proteines * 10) / 10));
    setGlucManuel(String(Math.round(totaux.glucides  * 10) / 10));
    setLipManuel (String(Math.round(totaux.lipides   * 10) / 10));
  }, [totaux, composition]);

  const ajouterIngredient = (ing: Ingredient) => {
    setComposition((prev) => [...prev, { ing, poids: '100' }]);
    setRechercheIng('');
    setDropdownOuvert(false);
  };
  const mettreAJourPoids = (i: number, poids: string) =>
    setComposition((prev) => prev.map((item, idx) => idx === i ? { ...item, poids } : item));
  const retirerIngredient = (i: number) =>
    setComposition((prev) => prev.filter((_, idx) => idx !== i));

  // Scanner state
  const [produitOFF, setProduitOFF] = useState<ProduitOFF | null>(null);
  const [quantiteOFF, setQuantiteOFF] = useState('100');
  const [scanErreur, setScanErreur] = useState<string | null>(null);
  const [scanChargement, setScanChargement] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const favoris = useDbQuery(
    () => userId ? getFavoris(userId) : Promise.resolve([] as FavoriRepas[]),
    [] as FavoriRepas[],
    [userId],
  );

  // Scanner lifecycle: start when tab is active, stop otherwise
  useEffect(() => {
    if (onglet !== 'scanner' || !ouvert || produitOFF || scanChargement) return;

    let stopped = false;

    (async () => {
      setScanErreur(null);
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCamera = devices.find((d: MediaDeviceInfo) => /back|rear|environment/i.test(d.label));
        const deviceId = backCamera?.deviceId ?? devices[0]?.deviceId ?? null;

        if (stopped || !videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, async (result: any) => {
          if (!result || stopped) return;
          stopped = true;
          try { controls?.stop(); } catch {}
          controlsRef.current = null;

          setScanChargement(true);
          const code = result.getText();
          const produit = await rechercherParCode(code);
          setScanChargement(false);

          if (produit) {
            setProduitOFF(produit);
            setQuantiteOFF('100');
          } else {
            setScanErreur(`Produit non trouvé (code : ${code})`);
          }
        });

        if (stopped) {
          try { controls?.stop(); } catch {}
        } else {
          controlsRef.current = controls;
        }
      } catch {
        if (!stopped) setScanErreur("Impossible d'accéder à la caméra");
      }
    })();

    return () => {
      stopped = true;
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch {}
        controlsRef.current = null;
      }
    };
  }, [onglet, ouvert, produitOFF, scanChargement]);

  const reinitialiser = () => {
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch {}
      controlsRef.current = null;
    }
    setProduitOFF(null); setScanErreur(null); setScanChargement(false);
    setAnalyse(null); setPhotoBase64(null);
    setNomManuel(''); setCalManuel(''); setProtManuel(''); setGlucManuel(''); setLipManuel('');
    setErreur(null); setSauverFavori(false);
    setRechercheIng(''); setComposition([]); setDropdownOuvert(false);
    onFermer();
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setChargement(true); setErreur(null);
    try {
      const { base64, mimeType } = await fileToBase64(fichier);
      setPhotoBase64(base64);
      const resultat = await analyserRepasParPhoto(base64, mimeType);
      setAnalyse(resultat);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setChargement(false);
    }
  };

  const validerRepas = async (baseRepas?: Partial<Repas>) => {
    const repas: Repas = baseRepas
      ? { userId, date: TODAY, createdAt: TODAY, categorie, ...baseRepas } as Repas
      : analyse
      ? { userId, date: TODAY, createdAt: TODAY, categorie, nom: analyse.description || 'Repas analysé', calories: analyse.caloriesTotal, proteines: analyse.proteinesTotal, glucides: analyse.glucidesTotal, lipides: analyse.lipidesTotal, aliments: analyse.aliments, photoBase64: photoBase64 ?? undefined }
      : { userId, date: TODAY, createdAt: TODAY, categorie, nom: nomManuel, calories: parseFloat(calManuel), proteines: protManuel ? parseFloat(protManuel) : undefined, glucides: glucManuel ? parseFloat(glucManuel) : undefined, lipides: lipManuel ? parseFloat(lipManuel) : undefined };

    await addRepas(repas as Omit<Repas, 'id'>);
    if (sauverFavori && repas.nom) {
      await ajouterFavori({ userId, nom: repas.nom, calories: repas.calories, proteines: repas.proteines, glucides: repas.glucides, lipides: repas.lipides, categorie: repas.categorie });
    }
    refreshDb();
    reinitialiser();
  };

  const CategorieSelector = () => (
    <div>
      <p className="label">Moment du repas</p>
      <div className="grid grid-cols-4 gap-2">
        {CATS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCategorie(c.id)}
            className={`py-2.5 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
              categorie === c.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-800 text-slate-500'
            }`}
          >
            <c.Icon size={16} className={categorie === c.id ? 'text-white' : c.color} />
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );

  const onglets = [
    { id: 'photo' as const,   Icon: Camera,   label: 'Photo' },
    { id: 'manuel' as const,  Icon: Pencil,   label: 'Manuel' },
    { id: 'favoris' as const, Icon: Star,     label: 'Favoris' },
    { id: 'scanner' as const, Icon: ScanLine, label: 'Scanner' },
  ];

  return (
    <Modal ouvert={ouvert} onFermer={reinitialiser} titre="Ajouter un repas" taille="lg">
      <div className="flex gap-1 mb-5 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl">
        {onglets.map((o) => (
          <button key={o.id} onClick={() => { setOnglet(o.id); setAnalyse(null); setPhotoBase64(null); setProduitOFF(null); setScanErreur(null); }}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              onglet === o.id
                ? 'bg-white dark:bg-gray-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <o.Icon size={13} />
            {o.label}
          </button>
        ))}
      </div>

      {/* Photo */}
      {onglet === 'photo' && (
        <div className="space-y-4">
          <CategorieSelector />
          {!photoBase64 && !chargement && (
            <>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-xl border-2 border-dashed border-slate-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-green-400 transition-colors"
              >
                <Camera size={28} className="text-slate-300" />
                <p className="text-sm text-slate-400 font-medium">Prendre ou choisir une photo</p>
              </button>
            </>
          )}
          {chargement && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-10 h-10 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Analyse en cours…</p>
            </div>
          )}
          {erreur && <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm text-red-600 dark:text-red-400">{erreur}</div>}
          {photoBase64 && analyse && !chargement && (
            <div className="space-y-3">
              <img src={`data:image/jpeg;base64,${photoBase64}`} className="w-full h-36 object-cover rounded-xl" alt="Repas" />
              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="font-semibold text-slate-800 dark:text-gray-200 mb-2 text-sm">{analyse.description}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="font-black text-slate-900 dark:text-white">{analyse.caloriesTotal}</p><p className="text-[10px] text-slate-400">kcal</p></div>
                  <div><p className="font-black text-blue-600">{analyse.proteinesTotal}g</p><p className="text-[10px] text-slate-400">prot.</p></div>
                  <div><p className="font-black text-amber-600">{analyse.glucidesTotal}g</p><p className="text-[10px] text-slate-400">gluc.</p></div>
                  <div><p className="font-black text-red-500">{analyse.lipidesTotal}g</p><p className="text-[10px] text-slate-400">lip.</p></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variante="secondary" onClick={() => { setAnalyse(null); setPhotoBase64(null); }}>Réessayer</Button>
                <Button pleine onClick={() => validerRepas()}>Valider</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manuel */}
      {onglet === 'manuel' && (
        <div className="space-y-4">
          <CategorieSelector />

          {/* ── Bibliothèque d'ingrédients ── */}
          <div>
            <p className="label">Composer depuis la bibliothèque</p>
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className="input pl-8"
                  placeholder="Merguez, saumon, riz cuit…"
                  value={rechercheIng}
                  onChange={(e) => { setRechercheIng(e.target.value); setDropdownOuvert(true); }}
                  onFocus={() => rechercheIng.length >= 2 && setDropdownOuvert(true)}
                  onBlur={() => setTimeout(() => setDropdownOuvert(false), 150)}
                />
              </div>
              {dropdownOuvert && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-100 dark:border-gray-700 overflow-hidden">
                  {suggestions.map((ing) => (
                    <button
                      key={ing.nom}
                      type="button"
                      onMouseDown={() => ajouterIngredient(ing)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-800 text-left border-b border-slate-50 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORIE_COLORS[ing.categorie]}`} />
                        <span className="text-sm text-slate-800 dark:text-gray-200 font-medium truncate">{ing.nom}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{CATEGORIE_LABELS[ing.categorie]}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 tabular-nums shrink-0 ml-2">{ing.calories100g} kcal/100g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Liste d'ingrédients composés */}
          {composition.length > 0 && (
            <div className="space-y-2">
              {composition.map((item, i) => {
                const kcalItem = Math.round(item.ing.calories100g * (parseFloat(item.poids) || 0) / 100);
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-gray-800 rounded-xl">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORIE_COLORS[item.ing.categorie]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">{item.ing.nom}</p>
                      <p className="text-[10px] text-slate-400">{kcalItem} kcal{item.ing.note ? ` · ${item.ing.note}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={item.poids}
                        onChange={(e) => mettreAJourPoids(i, e.target.value)}
                        className="w-14 text-sm text-center border border-slate-200 dark:border-gray-600 rounded-lg px-1 py-1 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500 font-bold tabular-nums"
                      />
                      <span className="text-xs text-slate-400">g</span>
                      <button
                        onClick={() => retirerIngredient(i)}
                        className="p-1 text-slate-300 hover:text-red-400 rounded-lg ml-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Totaux */}
              <div className="grid grid-cols-4 gap-2 text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <div>
                  <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{totaux.calories}</p>
                  <p className="text-[10px] text-slate-400">kcal</p>
                </div>
                <div>
                  <p className="text-lg font-black text-blue-600 tabular-nums">{Math.round(totaux.proteines * 10) / 10}g</p>
                  <p className="text-[10px] text-slate-400">prot.</p>
                </div>
                <div>
                  <p className="text-lg font-black text-amber-600 tabular-nums">{Math.round(totaux.glucides * 10) / 10}g</p>
                  <p className="text-[10px] text-slate-400">gluc.</p>
                </div>
                <div>
                  <p className="text-lg font-black text-red-500 tabular-nums">{Math.round(totaux.lipides * 10) / 10}g</p>
                  <p className="text-[10px] text-slate-400">lip.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Champs finaux (auto-remplis ou manuels) ── */}
          <div className="h-px bg-slate-100 dark:bg-gray-800" />
          <div>
            <label className="label">Nom du repas</label>
            <input
              className="input"
              placeholder={composition.length > 0 ? '' : 'Salade de quinoa…'}
              value={nomManuel}
              onChange={(e) => setNomManuel(e.target.value)}
            />
          </div>

          {/* Affiche les champs kcal/macros uniquement en saisie libre (pas d'ingrédients) */}
          {composition.length === 0 && (
            <>
              <div>
                <label className="label">Calories (kcal)</label>
                <input className="input" type="number" placeholder="450" value={calManuel} onChange={(e) => setCalManuel(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Protéines', color: 'text-blue-600',  val: protManuel, set: setProtManuel },
                  { label: 'Glucides',  color: 'text-amber-600', val: glucManuel, set: setGlucManuel },
                  { label: 'Lipides',   color: 'text-red-500',   val: lipManuel,  set: setLipManuel  },
                ].map((m) => (
                  <div key={m.label}>
                    <label className={`label ${m.color}`}>{m.label} (g)</label>
                    <input className="input" type="number" value={m.val} onChange={(e) => m.set(e.target.value)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {nomManuel && (calManuel || composition.length > 0) && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sauverFavori} onChange={(e) => setSauverFavori(e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
              <span className="text-sm text-slate-500">Sauvegarder comme favori</span>
            </label>
          )}
          <Button pleine taille="lg" onClick={() => validerRepas()} disabled={!nomManuel || (!calManuel && composition.length === 0)}>
            Ajouter ce repas
          </Button>
        </div>
      )}

      {/* Favoris */}
      {onglet === 'favoris' && (
        <div className="space-y-2">
          {favoris.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <Star size={32} className="mb-2 text-slate-200" />
              <p className="text-sm font-medium">Aucun favori enregistré</p>
              <p className="text-xs mt-1 text-center text-slate-300">Ajoutez un repas manuellement et cochez "Sauvegarder comme favori"</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-3">Appuyez pour ajouter directement</p>
              {favoris.map((fav) => {
                const cat = CATS.find((c) => c.id === fav.categorie);
                return (
                  <div key={fav.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-gray-600">
                      {cat ? <cat.Icon size={16} className={cat.color} /> : <Sun size={16} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => validerRepas({ nom: fav.nom, calories: fav.calories, proteines: fav.proteines, glucides: fav.glucides, lipides: fav.lipides })}>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate">{fav.nom}</p>
                      <p className="text-xs text-slate-400 tabular-nums">{fav.calories} kcal</p>
                    </div>
                    <button onClick={async () => { await supprimerFavori(fav.id!); refreshDb(); }} className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Scanner codes-barres */}
      {onglet === 'scanner' && (
        <div className="space-y-4">
          <CategorieSelector />

          {!produitOFF && !scanChargement && (
            <div className="relative overflow-hidden rounded-xl bg-black aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {/* Viseur */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-32">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-green-400/60 -translate-y-1/2" />
                </div>
              </div>
              <p className="absolute bottom-3 left-0 right-0 text-center text-white/70 text-xs font-medium">
                Pointez vers un code-barres
              </p>
            </div>
          )}

          {scanErreur && !produitOFF && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
              <span>{scanErreur}</span>
              <button
                onClick={() => setScanErreur(null)}
                className="text-xs underline shrink-0"
              >
                Réessayer
              </button>
            </div>
          )}

          {scanChargement && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-10 h-10 border-[3px] border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Recherche du produit…</p>
            </div>
          )}

          {produitOFF && (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 flex gap-3 items-start">
                {produitOFF.image && (
                  <img
                    src={produitOFF.image}
                    className="w-16 h-16 rounded-lg object-contain bg-white flex-shrink-0 border border-slate-100 dark:border-gray-700"
                    alt={produitOFF.nom}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-gray-200 text-sm leading-tight">{produitOFF.nom}</p>
                  {produitOFF.marque && <p className="text-xs text-slate-400 mt-0.5">{produitOFF.marque}</p>}
                  <div className="grid grid-cols-4 gap-1 mt-2 text-center">
                    <div><p className="font-black text-slate-900 dark:text-white text-sm">{produitOFF.calories100g}</p><p className="text-[9px] text-slate-400">kcal/100g</p></div>
                    <div><p className="font-black text-blue-600 text-sm">{produitOFF.proteines100g}g</p><p className="text-[9px] text-slate-400">prot.</p></div>
                    <div><p className="font-black text-amber-600 text-sm">{produitOFF.glucides100g}g</p><p className="text-[9px] text-slate-400">gluc.</p></div>
                    <div><p className="font-black text-red-500 text-sm">{produitOFF.lipides100g}g</p><p className="text-[9px] text-slate-400">lip.</p></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Quantité consommée (g)</label>
                <input
                  className="input text-xl font-bold text-center"
                  type="number"
                  min="1"
                  max="5000"
                  value={quantiteOFF}
                  onChange={(e) => setQuantiteOFF(e.target.value)}
                />
              </div>

              {quantiteOFF && parseFloat(quantiteOFF) > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-700 dark:text-green-300">
                    {Math.round(produitOFF.calories100g * parseFloat(quantiteOFF) / 100)} kcal
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">pour {quantiteOFF} g</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variante="secondary" onClick={() => { setProduitOFF(null); setScanErreur(null); }}>
                  Rescanner
                </Button>
                <Button pleine onClick={() => {
                  const qte = parseFloat(quantiteOFF);
                  if (!qte || qte <= 0) return;
                  const ratio = qte / 100;
                  validerRepas({
                    nom: produitOFF!.nom + (produitOFF!.marque ? ` (${produitOFF!.marque})` : ''),
                    calories: Math.round(produitOFF!.calories100g * ratio),
                    proteines: Math.round(produitOFF!.proteines100g * ratio * 10) / 10,
                    glucides: Math.round(produitOFF!.glucides100g * ratio * 10) / 10,
                    lipides: Math.round(produitOFF!.lipides100g * ratio * 10) / 10,
                  });
                }}>
                  Ajouter
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

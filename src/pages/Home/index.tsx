import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import {
  Target, Footprints, Dumbbell, Droplets, Moon, Ban, Wine, Candy, Salad,
  Camera, Pencil, Star, Plus, Check, Flame, Sunrise, Sun, Sunset, Apple,
  ChevronRight, Trash2,
} from 'lucide-react';
import { db } from '../../db/database';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CircularGauge } from '../../components/ui/CircularGauge';
import { Modal } from '../../components/ui/Modal';
import { CHALLENGES } from '../../utils/challenges';
import { calculerStreak } from '../../utils/streak';
import { analyserRepasParPhoto, fileToBase64 } from '../../services/claudeApi';
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
  const userId = user?.id ?? 0;

  const repasAujourdhui = useLiveQuery(
    () => userId ? db.repas.where('userId').equals(userId).and((r) => r.date === TODAY).toArray() : Promise.resolve([] as Repas[]),
    [userId],
  ) ?? [];
  const toutesJournees = useLiveQuery(
    () => userId ? db.journees.where('userId').equals(userId).toArray() : Promise.resolve([] as import('../../types').Journee[]),
    [userId],
  ) ?? [];

  const streak = calculerStreak(toutesJournees);
  const caloriesConsommees = repasAujourdhui.reduce((s, r) => s + r.calories, 0);
  const objectifCal = user?.objectifCalories ?? 1800;

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
      case 'pas':
        estCoche = journeeAujourdhui.pas >= user.objectifPas;
        contenu = (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400 tabular-nums">
              {journeeAujourdhui.pas.toLocaleString('fr')} / {user.objectifPas.toLocaleString('fr')}
            </span>
            <div className="flex items-center gap-1">
              <input
                className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-0.5 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                type="number" placeholder="saisir"
                value={pasInput}
                onChange={(e) => setPasInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saisirPas()}
              />
              <button onClick={saisirPas} className="text-xs text-green-600 font-bold px-1">OK</button>
            </div>
          </div>
        );
        break;
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

      {/* Jauge */}
      <Card className="flex flex-col items-center py-6 gap-4">
        <CircularGauge valeur={caloriesConsommees} objectif={objectifCal} />
        <Button taille="md" onClick={() => setModalRepas(true)} className="gap-2">
          <Plus size={16} strokeWidth={2.5} />
          Ajouter un repas
        </Button>
      </Card>

      {/* Macros */}
      {repasAujourdhui.length > 0 && (
        <Card>
          <p className="text-xs font-semibold tracking-wide uppercase text-slate-400 mb-3">Macros du jour</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Protéines', val: repasAujourdhui.reduce((s, r) => s + (r.proteines ?? 0), 0), color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Glucides',  val: repasAujourdhui.reduce((s, r) => s + (r.glucides ?? 0), 0),  color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Lipides',   val: repasAujourdhui.reduce((s, r) => s + (r.lipides ?? 0), 0),   color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map((m) => (
              <div key={m.label} className={`${m.bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-black tabular-nums ${m.color}`}>{Math.round(m.val)}g</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
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
function ModalAjoutRepas({ ouvert, onFermer, userId }: { ouvert: boolean; onFermer: () => void; userId: number }) {
  const [onglet, setOnglet] = useState<'photo' | 'manuel' | 'favoris'>('photo');
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

  const favoris = useLiveQuery(
    () => userId ? db.favoris.where('userId').equals(userId).toArray() : Promise.resolve([] as FavoriRepas[]),
    [userId],
  ) ?? [];

  const reinitialiser = () => {
    setAnalyse(null); setPhotoBase64(null);
    setNomManuel(''); setCalManuel(''); setProtManuel(''); setGlucManuel(''); setLipManuel('');
    setErreur(null); setSauverFavori(false);
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

    await db.repas.add(repas);
    if (sauverFavori && repas.nom) {
      await db.favoris.add({ userId, nom: repas.nom, calories: repas.calories, proteines: repas.proteines, glucides: repas.glucides, lipides: repas.lipides, categorie: repas.categorie });
    }
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
    { id: 'photo' as const,   Icon: Camera, label: 'Photo' },
    { id: 'manuel' as const,  Icon: Pencil, label: 'Manuel' },
    { id: 'favoris' as const, Icon: Star,   label: 'Favoris' },
  ];

  return (
    <Modal ouvert={ouvert} onFermer={reinitialiser} titre="Ajouter un repas" taille="lg">
      <div className="flex gap-1.5 mb-5 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl">
        {onglets.map((o) => (
          <button key={o.id} onClick={() => { setOnglet(o.id); setAnalyse(null); setPhotoBase64(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              onglet === o.id
                ? 'bg-white dark:bg-gray-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            <o.Icon size={14} />
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
          <div>
            <label className="label">Nom du repas</label>
            <input className="input" placeholder="Salade de quinoa" value={nomManuel} onChange={(e) => setNomManuel(e.target.value)} />
          </div>
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
          {nomManuel && calManuel && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sauverFavori} onChange={(e) => setSauverFavori(e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
              <span className="text-sm text-slate-500">Sauvegarder comme favori</span>
            </label>
          )}
          <Button pleine taille="lg" onClick={() => validerRepas()} disabled={!nomManuel || !calManuel}>
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
                    <button onClick={() => db.favoris.delete(fav.id!)} className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

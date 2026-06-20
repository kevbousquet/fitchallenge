import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import confetti from 'canvas-confetti';
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

const CATS: { id: CategoriRepas; emoji: string; label: string }[] = [
  { id: 'petit_dejeuner', emoji: '🌅', label: 'Matin' },
  { id: 'dejeuner',       emoji: '☀️', label: 'Midi' },
  { id: 'diner',          emoji: '🌙', label: 'Soir' },
  { id: 'collation',      emoji: '🍎', label: 'Snack' },
];

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

  const validerSport = async () => {
    await mettreAJourJournee({ sportFait: true, typeSport, dureeSport: parseInt(dureeSport) });
    setModalSport(false);
    lancerConfettis();
  };

  const lancerConfettis = () => {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#22c55e', '#14b8a6', '#86efac'] });
  };

  const basculeCheck = async (id: ChallengeId) => {
    if (!journeeAujourdhui) return;
    const map: Record<string, keyof typeof journeeAujourdhui> = {
      sommeil:           'sommeilOk',
      pas_de_grignotage: 'pasDeGrignotage',
      pas_alcool:        'pasDAlcool',
      pas_sucre:         'pasDeSucre',
      legumes:           'legumesMange',
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
    if (!c || !journeeAujourdhui || !user) return null;

    let estCoche = false;
    let contenu: React.ReactNode = null;

    switch (id) {
      case 'deficit_calorique':
        estCoche = caloriesConsommees <= objectifCal;
        contenu = (
          <span className="text-xs text-gray-400">
            {caloriesConsommees} / {objectifCal} kcal
          </span>
        );
        break;

      case 'pas':
        estCoche = journeeAujourdhui.pas >= user.objectifPas;
        contenu = (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {journeeAujourdhui.pas.toLocaleString('fr')} / {user.objectifPas.toLocaleString('fr')} pas
            </span>
            <div className="flex items-center gap-1">
              <input
                className="w-20 text-xs border rounded-lg px-2 py-0.5 dark:bg-gray-800 dark:border-gray-600"
                type="number"
                placeholder="saisir"
                value={pasInput}
                onChange={(e) => setPasInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saisirPas()}
              />
              <button onClick={saisirPas} className="text-xs text-green-600 font-bold">OK</button>
            </div>
          </div>
        );
        break;

      case 'sport':
        estCoche = journeeAujourdhui.sportFait;
        contenu = journeeAujourdhui.sportFait ? (
          <span className="text-xs text-gray-400">
            {journeeAujourdhui.typeSport} · {journeeAujourdhui.dureeSport} min
          </span>
        ) : null;
        break;

      case 'hydratation':
        estCoche = journeeAujourdhui.verresBus >= user.objectifVerres;
        contenu = (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1">
              {Array.from({ length: user.objectifVerres }).map((_, i) => (
                <span key={i} className="text-base">
                  {i < journeeAujourdhui.verresBus ? '💧' : '○'}
                </span>
              ))}
            </div>
            <button onClick={ajouterVerre} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-lg">
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
        className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${clicable ? 'cursor-pointer active:scale-98' : ''} ${estCoche ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}
      >
        <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${estCoche ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
          {estCoche && <span className="text-xs">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span>{c.emoji}</span>
            <span className={`text-sm font-semibold ${estCoche ? 'text-green-700 dark:text-green-300 line-through opacity-70' : 'text-gray-800 dark:text-gray-200'}`}>
              {c.label}
            </span>
          </div>
          {contenu}
        </div>
      </div>
    );
  };

  return (
    <Layout
      titre={`Bonjour ${user?.prenom ?? ''} 👋`}
      actions={streak > 0 ? <span className="text-lg font-bold text-orange-500">🔥 {streak}</span> : null}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 capitalize">
        {format(new Date(), 'EEEE d MMMM', { locale: fr })}
      </p>

      <Card className="flex flex-col items-center py-6">
        <CircularGauge valeur={caloriesConsommees} objectif={objectifCal} />
        <Button className="mt-5" taille="lg" onClick={() => setModalRepas(true)}>
          + Ajouter un repas
        </Button>
      </Card>

      {repasAujourdhui.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Macros du jour</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Protéines', valeur: repasAujourdhui.reduce((s, r) => s + (r.proteines ?? 0), 0), couleur: 'text-blue-600' },
              { label: 'Glucides',  valeur: repasAujourdhui.reduce((s, r) => s + (r.glucides ?? 0), 0),  couleur: 'text-amber-600' },
              { label: 'Lipides',   valeur: repasAujourdhui.reduce((s, r) => s + (r.lipides ?? 0), 0),   couleur: 'text-red-500' },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3">
                <p className={`text-xl font-bold ${m.couleur}`}>{Math.round(m.valeur)}g</p>
                <p className="text-xs text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Challenges du jour</h3>
        <div className="space-y-2">
          {user?.challengesActifs.map(renderChallenge)}
        </div>
        {journeeAujourdhui?.parfaite && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl text-white text-center">
            <p className="font-bold">🎉 Journée parfaite !</p>
            <p className="text-sm text-green-100">Tous les challenges accomplis !</p>
          </div>
        )}
      </Card>

      {repasAujourdhui.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            Repas aujourd'hui ({repasAujourdhui.length})
          </h3>
          <div className="space-y-2">
            {repasAujourdhui.slice(-3).map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                {r.photoBase64 ? (
                  <img src={`data:image/jpeg;base64,${r.photoBase64}`} className="w-12 h-12 rounded-xl object-cover" alt={r.nom} />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                    {CATS.find((c) => c.id === r.categorie)?.emoji ?? '🍽️'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.nom}</p>
                  <p className="text-xs text-gray-400">{r.calories} kcal</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ModalAjoutRepas ouvert={modalRepas} onFermer={() => setModalRepas(false)} userId={userId} />

      <Modal ouvert={modalSport} onFermer={() => setModalSport(false)} titre="Séance de sport">
        <div className="space-y-4">
          <div>
            <label className="label">Type de séance</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cardio', 'musculation', 'marche', 'autre'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeSport(t)}
                  className={`py-3 rounded-2xl border-2 font-medium capitalize transition-all ${
                    typeSport === t
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500'
                  }`}
                >
                  {t === 'cardio' ? '🏃 Cardio' : t === 'musculation' ? '💪 Muscu' : t === 'marche' ? '🚶 Marche' : '⚡ Autre'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Durée (minutes)</label>
            <input className="input" type="number" min="5" max="300" value={dureeSport} onChange={(e) => setDureeSport(e.target.value)} />
          </div>
          <Button pleine taille="lg" onClick={validerSport}>✅ Valider la séance</Button>
        </div>
      </Modal>
    </Layout>
  );
}

// ─── Modal d'ajout de repas ──────────────────────────────────────────────────
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
      ? {
          userId, date: TODAY, createdAt: TODAY, categorie,
          nom: analyse.description || 'Repas analysé',
          calories: analyse.caloriesTotal,
          proteines: analyse.proteinesTotal,
          glucides: analyse.glucidesTotal,
          lipides: analyse.lipidesTotal,
          aliments: analyse.aliments,
          photoBase64: photoBase64 ?? undefined,
        }
      : {
          userId, date: TODAY, createdAt: TODAY, categorie,
          nom: nomManuel,
          calories: parseFloat(calManuel),
          proteines: protManuel ? parseFloat(protManuel) : undefined,
          glucides: glucManuel ? parseFloat(glucManuel) : undefined,
          lipides: lipManuel ? parseFloat(lipManuel) : undefined,
        };

    await db.repas.add(repas);

    if (sauverFavori && repas.nom) {
      await db.favoris.add({
        userId,
        nom: repas.nom,
        calories: repas.calories,
        proteines: repas.proteines,
        glucides: repas.glucides,
        lipides: repas.lipides,
        categorie: repas.categorie,
      });
    }

    reinitialiser();
  };

  const supprimerFavori = async (id: number) => {
    await db.favoris.delete(id);
  };

  const CategorieSelector = () => (
    <div>
      <label className="label">Moment du repas</label>
      <div className="grid grid-cols-4 gap-1.5">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategorie(c.id)}
            className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-0.5 transition-all ${
              categorie === c.id
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}
          >
            <span className="text-base">{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal ouvert={ouvert} onFermer={reinitialiser} titre="Ajouter un repas" taille="lg">
      {/* Onglets */}
      <div className="flex gap-2 mb-5">
        {([
          { id: 'photo',   label: '📸 Photo' },
          { id: 'manuel',  label: '✏️ Manuel' },
          { id: 'favoris', label: '⭐ Favoris' },
        ] as const).map((o) => (
          <button
            key={o.id}
            onClick={() => { setOnglet(o.id); setAnalyse(null); setPhotoBase64(null); }}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              onglet === o.id
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── Photo ── */}
      {onglet === 'photo' && (
        <div className="space-y-4">
          <CategorieSelector />

          {!photoBase64 && !chargement && (
            <>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-green-400 transition-colors"
              >
                <span className="text-4xl">📸</span>
                <p className="text-sm text-gray-500">Prendre ou choisir une photo</p>
              </div>
            </>
          )}

          {chargement && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Claude analyse votre repas…</p>
            </div>
          )}

          {erreur && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl text-sm text-red-600 dark:text-red-400">
              ❌ {erreur}
            </div>
          )}

          {photoBase64 && analyse && !chargement && (
            <div className="space-y-3">
              <img src={`data:image/jpeg;base64,${photoBase64}`} className="w-full h-40 object-cover rounded-2xl" alt="Repas analysé" />
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3">
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{analyse.description}</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div><p className="font-bold text-gray-900 dark:text-white">{analyse.caloriesTotal}</p><p className="text-gray-400">kcal</p></div>
                  <div><p className="font-bold text-blue-600">{analyse.proteinesTotal}g</p><p className="text-gray-400">prot.</p></div>
                  <div><p className="font-bold text-amber-600">{analyse.glucidesTotal}g</p><p className="text-gray-400">gluc.</p></div>
                  <div><p className="font-bold text-red-500">{analyse.lipidesTotal}g</p><p className="text-gray-400">lip.</p></div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variante="secondary" onClick={() => { setAnalyse(null); setPhotoBase64(null); }}>Réessayer</Button>
                <Button pleine onClick={() => validerRepas()}>✅ Valider</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Manuel ── */}
      {onglet === 'manuel' && (
        <div className="space-y-4">
          <CategorieSelector />
          <div>
            <label className="label">Nom du repas</label>
            <input className="input" placeholder="Ex: Salade de quinoa" value={nomManuel} onChange={(e) => setNomManuel(e.target.value)} />
          </div>
          <div>
            <label className="label">Calories (kcal) *</label>
            <input className="input" type="number" placeholder="450" value={calManuel} onChange={(e) => setCalManuel(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label text-blue-600">Protéines (g)</label>
              <input className="input" type="number" placeholder="30" value={protManuel} onChange={(e) => setProtManuel(e.target.value)} />
            </div>
            <div>
              <label className="label text-amber-600">Glucides (g)</label>
              <input className="input" type="number" placeholder="45" value={glucManuel} onChange={(e) => setGlucManuel(e.target.value)} />
            </div>
            <div>
              <label className="label text-red-500">Lipides (g)</label>
              <input className="input" type="number" placeholder="12" value={lipManuel} onChange={(e) => setLipManuel(e.target.value)} />
            </div>
          </div>

          {nomManuel && calManuel && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sauverFavori}
                onChange={(e) => setSauverFavori(e.target.checked)}
                className="w-4 h-4 rounded accent-green-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">⭐ Sauvegarder comme favori</span>
            </label>
          )}

          <Button pleine taille="lg" onClick={() => validerRepas()} disabled={!nomManuel || !calManuel}>
            ✅ Ajouter ce repas
          </Button>
        </div>
      )}

      {/* ── Favoris ── */}
      {onglet === 'favoris' && (
        <div className="space-y-3">
          {favoris.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <span className="text-4xl mb-2">⭐</span>
              <p className="text-sm font-medium">Aucun favori enregistré</p>
              <p className="text-xs mt-1 text-center">Ajoutez un repas manuellement et cochez "Sauvegarder comme favori"</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">Appuyez sur un favori pour l'ajouter directement</p>
              <div className="space-y-2">
                {favoris.map((fav) => (
                  <div key={fav.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <span className="text-xl">{CATS.find((c) => c.id === fav.categorie)?.emoji ?? '🍽️'}</span>
                    <div className="flex-1 min-w-0" onClick={() => validerRepas({ nom: fav.nom, calories: fav.calories, proteines: fav.proteines, glucides: fav.glucides, lipides: fav.lipides })}>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{fav.nom}</p>
                      <p className="text-xs text-gray-400">{fav.calories} kcal</p>
                    </div>
                    <button
                      onClick={() => supprimerFavori(fav.id!)}
                      className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

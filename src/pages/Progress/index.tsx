import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { Ruler, Scale, Trash2, Check, Trophy } from 'lucide-react';
import { db } from '../../db/database';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { estimerDateObjectif } from '../../utils/bmr';
import { calculerIMC, getCategorieIMC, poidsIdeal } from '../../utils/bmi';
import type { Pesee, Mesure, Repas } from '../../types';

type PlageDates = '7j' | '30j' | '90j' | 'tout';

function IllustrationMesures() {
  const points = [
    { n: 1, y: 108, color: '#3b82f6', label: 'Poitrine',       desc: 'Au niveau du point le plus saillant' },
    { n: 2, y: 176, color: '#ef4444', label: 'Tour de taille', desc: 'À l\'endroit le plus étroit (nombril)' },
    { n: 3, y: 222, color: '#8b5cf6', label: 'Hanches',        desc: 'Au point le plus large des hanches' },
  ];
  return (
    <div className="flex gap-3 items-start bg-slate-50 dark:bg-gray-800 rounded-xl p-3">
      <svg viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-40 w-auto shrink-0">
        {/* Silhouette torse féminin */}
        <path
          d="M100,42 C90,42 78,46 68,56 C58,66 50,78 46,94 C43,108 43,120 46,130 C49,140 56,150 62,160 C64,165 66,170 68,176 C66,184 56,198 48,218 C42,234 42,250 46,266 C50,278 54,285 58,290 L142,290 C146,285 150,278 154,266 C158,250 158,234 152,218 C144,198 134,184 132,176 C134,170 136,165 138,160 C144,150 151,140 154,130 C157,120 157,108 154,94 C150,78 142,66 132,56 C122,46 110,42 100,42Z"
          fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"
        />
        {/* Lignes de mesure */}
        {points.map((p) => (
          <g key={p.n}>
            <line x1="12" y1={p.y} x2="188" y2={p.y} stroke={p.color} strokeWidth="2.5" strokeDasharray="6,3" />
            <circle cx="12" cy={p.y} r="9" fill={p.color} />
            <text x="12" y={p.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">{p.n}</text>
          </g>
        ))}
      </svg>

      <div className="flex-1 space-y-2.5 pt-0.5">
        {points.map((p) => (
          <div key={p.n} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: p.color }}>{p.n}</span>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{p.label}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
            </div>
          </div>
        ))}
        <p className="text-[10px] text-slate-300 dark:text-slate-600 pt-1">Debout, à jeun, ruban bien horizontal.</p>
      </div>
    </div>
  );
}

function moyenneMobile(donnees: { date: string; poids: number }[], n: number) {
  return donnees.map((d, i) => {
    const debut = Math.max(0, i - n + 1);
    const fenetre = donnees.slice(debut, i + 1);
    const moy = fenetre.reduce((s, x) => s + x.poids, 0) / fenetre.length;
    return { ...d, tendance: Math.round(moy * 10) / 10 };
  });
}

const BtnPlage = ({ plage, actif, onClick }: { plage: string; actif: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${
      actif
        ? 'bg-green-600 text-white'
        : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-slate-500'
    }`}
  >
    {plage}
  </button>
);

export function Progress() {
  const { user } = useStore();
  const userId = user?.id ?? 0;

  const pesees = useLiveQuery(
    () => userId ? db.pesees.where('userId').equals(userId).sortBy('date') : Promise.resolve([] as Pesee[]),
    [userId],
  ) ?? [];

  const mesures = useLiveQuery(
    () => userId ? db.mesures.where('userId').equals(userId).sortBy('date') : Promise.resolve([] as Mesure[]),
    [userId],
  ) ?? [];

  const [plageCalories, setPlageCalories] = useState<PlageDates>('7j');
  const [plagePoids, setPlagePoids] = useState<PlageDates>('tout');

  const debutCal = useMemo(() => {
    if (plageCalories === 'tout') return '0000-00-00';
    const nb = plageCalories === '7j' ? 7 : plageCalories === '30j' ? 30 : 90;
    return format(subDays(new Date(), nb - 1), 'yyyy-MM-dd');
  }, [plageCalories]);

  const repasRange = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as Repas[]);
      const q = db.repas.where('userId').equals(userId);
      return plageCalories === 'tout'
        ? q.toArray()
        : q.and((r) => r.date >= debutCal).toArray();
    },
    [userId, plageCalories, debutCal],
  ) ?? [];

  const [modalPesee, setModalPesee] = useState(false);
  const [nouveauPoids, setNouveauPoids] = useState('');
  const [noteP, setNoteP] = useState('');
  const [modalSuppression, setModalSuppression] = useState<number | null>(null);

  const [modalMesure, setModalMesure] = useState(false);
  const [tourDeTaille, setTourDeTaille] = useState('');
  const [hanches, setHanches] = useState('');
  const [poitrine, setPoitrine] = useState('');
  const [noteM, setNoteM] = useState('');

  const dernierePesee = pesees.length > 0 ? pesees[pesees.length - 1] : null;
  const premierePesee = pesees.length > 0 ? pesees[0] : null;
  const derniereMesure = mesures.length > 0 ? mesures[mesures.length - 1] : null;

  const poidsInitial = premierePesee?.poids ?? user?.poidsInitial ?? 0;
  const poidsObjectif = user?.poidsObjectif ?? 0;
  const poidsActuel = dernierePesee?.poids ?? poidsInitial;
  const perteTotale = poidsInitial - poidsActuel;
  const resteAPerdre = Math.max(poidsActuel - poidsObjectif, 0);

  // IMC
  const imc = user?.taille && poidsActuel > 0 ? calculerIMC(poidsActuel, user.taille) : 0;
  const categorieIMC = imc > 0 ? getCategorieIMC(imc) : null;
  const poidsIdealRange = user?.taille ? poidsIdeal(user.taille) : null;

  const donneesGraphiqueBrut = pesees.map((p) => ({ date: p.date, poids: p.poids }));

  const donneesGraphique = useMemo(() => {
    if (plagePoids === 'tout') return moyenneMobile(donneesGraphiqueBrut, 7);
    const nb = plagePoids === '7j' ? 7 : plagePoids === '30j' ? 30 : 90;
    const cutoff = format(subDays(new Date(), nb), 'yyyy-MM-dd');
    return moyenneMobile(donneesGraphiqueBrut.filter((p) => p.date >= cutoff), 7);
  }, [donneesGraphiqueBrut, plagePoids]);

  let estimationDate: Date | null = null;
  if (pesees.length >= 2) {
    const jours = pesees.length - 1;
    const deltaPoids = pesees[0].poids - poidsActuel;
    const deficitJournalier = jours > 0 ? (deltaPoids / jours) * 7700 : 0;
    if (deficitJournalier > 50) {
      estimationDate = estimerDateObjectif(poidsActuel, poidsObjectif, deficitJournalier);
    }
  }

  const ajouterPesee = async () => {
    const poids = parseFloat(nouveauPoids);
    if (isNaN(poids) || !userId) return;
    await db.pesees.add({ userId, date: format(new Date(), 'yyyy-MM-dd'), poids, note: noteP || undefined });
    setNouveauPoids(''); setNoteP(''); setModalPesee(false);
  };

  const ajouterMesure = async () => {
    if (!userId) return;
    const m: Mesure = {
      userId,
      date: format(new Date(), 'yyyy-MM-dd'),
      tourDeTaille: tourDeTaille ? parseFloat(tourDeTaille) : undefined,
      hanches:      hanches      ? parseFloat(hanches)      : undefined,
      poitrine:     poitrine     ? parseFloat(poitrine)     : undefined,
      note: noteM || undefined,
    };
    if (!m.tourDeTaille && !m.hanches && !m.poitrine) return;
    await db.mesures.add(m);
    setTourDeTaille(''); setHanches(''); setPoitrine(''); setNoteM(''); setModalMesure(false);
  };

  // Données calories selon la plage sélectionnée
  const donneesCalories = useMemo(() => {
    if (plageCalories === '7j' || plageCalories === '30j') {
      const nb = plageCalories === '7j' ? 7 : 30;
      return Array.from({ length: nb }, (_, i) => {
        const d = format(subDays(new Date(), nb - 1 - i), 'yyyy-MM-dd');
        const cal = repasRange.filter((r) => r.date === d).reduce((s, r) => s + r.calories, 0);
        const label = i === nb - 1 ? 'Auj.'
          : plageCalories === '7j'
          ? format(subDays(new Date(), nb - 1 - i), 'EEE', { locale: fr })
          : format(subDays(new Date(), nb - 1 - i), 'd/MM');
        return { date: d, label, calories: cal };
      });
    }

    if (plageCalories === '90j') {
      // Moyennes hebdomadaires sur 13 semaines
      return Array.from({ length: 13 }, (_, i) => {
        const endD = subDays(new Date(), (12 - i) * 7);
        const startD = subDays(endD, 6);
        const startStr = format(startD, 'yyyy-MM-dd');
        const endStr = format(endD, 'yyyy-MM-dd');
        const repasS = repasRange.filter((r) => r.date >= startStr && r.date <= endStr);
        const calTotal = repasS.reduce((s, r) => s + r.calories, 0);
        const joursAvecData = new Set(repasS.map((r) => r.date)).size;
        return {
          date: endStr,
          label: format(startD, 'd/MM'),
          calories: joursAvecData > 0 ? Math.round(calTotal / joursAvecData) : 0,
        };
      });
    }

    // 'tout' : moyennes mensuelles
    if (repasRange.length === 0) return [];
    const parMois: Record<string, { total: number; jours: Set<string> }> = {};
    repasRange.forEach((r) => {
      const mois = r.date.slice(0, 7);
      if (!parMois[mois]) parMois[mois] = { total: 0, jours: new Set() };
      parMois[mois].total += r.calories;
      parMois[mois].jours.add(r.date);
    });
    return Object.entries(parMois)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, d]) => ({
        date: mois,
        label: format(new Date(mois + '-15'), 'MMM yy', { locale: fr }),
        calories: Math.round(d.total / d.jours.size),
      }));
  }, [repasRange, plageCalories]);

  const objectifCal = user?.objectifCalories ?? 0;

  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), 'd MMM', { locale: fr }); }
    catch { return dateStr; }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-slate-500">{formatDate(label)}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-bold">
            {p.name === 'poids' ? 'Poids' : 'Tendance'} : {p.value} kg
          </p>
        ))}
      </div>
    );
  };

  const labelCalories = plageCalories === '90j' ? 'Moy. hebdo' : plageCalories === 'tout' ? 'Moy. mensuelle' : 'Calories';

  return (
    <Layout
      titre="Progression"
      actions={
        <div className="flex gap-2">
          <Button taille="sm" variante="secondary" onClick={() => setModalMesure(true)}>
            <Ruler size={14} />
          </Button>
          <Button taille="sm" onClick={() => setModalPesee(true)}>
            <Scale size={14} /> Peser
          </Button>
        </div>
      }
    >
      {/* Résumé poids */}
      <Card gradient className="text-white">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-green-100 text-xs font-medium">Poids actuel</p>
            <p className="text-3xl font-black">{poidsActuel}</p>
            <p className="text-green-200 text-xs">kg</p>
          </div>
          <div>
            <p className="text-green-100 text-xs font-medium">Perdu</p>
            <p className="text-3xl font-black">{perteTotale > 0 ? `-${perteTotale.toFixed(1)}` : '0'}</p>
            <p className="text-green-200 text-xs">kg</p>
          </div>
          <div>
            <p className="text-green-100 text-xs font-medium">Objectif</p>
            <p className="text-3xl font-black">{poidsObjectif}</p>
            <p className="text-green-200 text-xs">kg</p>
          </div>
        </div>

        {resteAPerdre > 0 && (
          <div className="mt-4 text-center">
            <p className="text-green-100 text-sm">
              Encore <span className="font-black text-white">{resteAPerdre.toFixed(1)} kg</span> à perdre
            </p>
            {estimationDate && (
              <p className="text-green-200 text-xs mt-1">
                À votre rythme actuel : {format(estimationDate, 'MMMM yyyy', { locale: fr })}
              </p>
            )}
          </div>
        )}
        {resteAPerdre <= 0 && pesees.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Trophy size={20} className="text-amber-300" />
            <p className="font-bold text-white text-lg">Objectif atteint !</p>
          </div>
        )}
      </Card>

      {/* IMC */}
      {imc > 0 && categorieIMC && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Indice de Masse Corporelle</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${categorieIMC.color} ${categorieIMC.bgColor}`}>
              {categorieIMC.label}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className={`text-4xl font-black tabular-nums ${categorieIMC.color}`}>{imc}</p>
              <p className="text-xs text-slate-400 mt-0.5">IMC</p>
            </div>

            <div className="flex-1">
              {/* Barre colorée */}
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="flex-1 bg-blue-300 dark:bg-blue-600" />
                <div className="flex-1 bg-green-400 dark:bg-green-600" />
                <div className="flex-1 bg-amber-400 dark:bg-amber-600" />
                <div className="flex-1 bg-orange-400 dark:bg-orange-600" />
                <div className="flex-1 bg-red-400 dark:bg-red-600" />
              </div>
              {/* Curseur positionné sur la barre (plage 15–45) */}
              <div className="relative h-3 -mt-3 mb-1 pointer-events-none">
                {(() => {
                  const pct = Math.min(Math.max((imc - 15) / (45 - 15), 0), 1);
                  return (
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-slate-800 dark:bg-white rounded-full -translate-x-1/2 shadow"
                      style={{ left: `${pct * 100}%` }}
                    />
                  );
                })()}
              </div>
              <div className="flex justify-between text-[9px] text-slate-300 dark:text-slate-600 mt-1">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>35</span>
                <span>45</span>
              </div>
            </div>
          </div>

          {poidsIdealRange && (
            <p className="text-xs text-slate-400 mt-3">
              Poids idéal pour {user!.taille} cm :
              <span className="font-semibold text-green-600 dark:text-green-400 ml-1">
                {poidsIdealRange.min} – {poidsIdealRange.max} kg
              </span>
            </p>
          )}
        </Card>
      )}

      {/* Graphique calories */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Calories</h3>
          <div className="flex gap-1">
            {(['7j', '30j', '90j', 'tout'] as PlageDates[]).map((p) => (
              <BtnPlage key={p} plage={p === 'tout' ? 'Tout' : p} actif={plageCalories === p} onClick={() => setPlageCalories(p)} />
            ))}
          </div>
        </div>
        {objectifCal > 0 && (
          <p className="text-xs text-slate-400 mb-3">Objectif : {objectifCal} kcal/j</p>
        )}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={donneesCalories} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
            <Tooltip
              formatter={(val) => [`${val ?? 0} kcal`, labelCalories]}
              labelStyle={{ color: '#64748b', fontSize: 12 }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            {objectifCal > 0 && plageCalories !== 'tout' && (
              <ReferenceLine
                y={objectifCal}
                stroke="#16a34a"
                strokeDasharray="5 3"
                label={{ value: 'Obj.', position: 'right', fontSize: 10, fill: '#16a34a' }}
              />
            )}
            <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {donneesCalories.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.calories === 0
                      ? '#e2e8f0'
                      : objectifCal > 0 && d.calories > objectifCal
                      ? '#f87171'
                      : '#14b8a6'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-teal-500 inline-block" /> Sous l'objectif</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Dépassé</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" /> Pas de données</span>
        </div>
      </Card>

      {/* Mesures corporelles */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ruler size={14} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Mesures corporelles</h3>
          </div>
          <button
            onClick={() => setModalMesure(true)}
            className="text-xs text-green-600 dark:text-green-400 font-semibold"
          >
            + Ajouter
          </button>
        </div>

        {!derniereMesure ? (
          <div className="flex flex-col items-center py-6 text-slate-400">
            <Ruler size={32} className="mb-2 text-slate-200" strokeWidth={1.5} />
            <p className="text-sm">Aucune mesure enregistrée</p>
            <p className="text-xs mt-1 text-slate-300">Tour de taille, hanches, poitrine…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Dernière mesure : {format(new Date(derniereMesure.date), 'd MMMM yyyy', { locale: fr })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tour de taille', valeur: derniereMesure.tourDeTaille, couleur: 'text-blue-600' },
                { label: 'Hanches',        valeur: derniereMesure.hanches,      couleur: 'text-purple-600' },
                { label: 'Poitrine',       valeur: derniereMesure.poitrine,     couleur: 'text-pink-600' },
              ].map((m) => (
                <div key={m.label} className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-3 text-center">
                  {m.valeur ? (
                    <>
                      <p className={`text-xl font-black ${m.couleur}`}>{m.valeur}</p>
                      <p className="text-slate-400 text-[10px]">cm</p>
                    </>
                  ) : (
                    <p className="text-slate-300 text-xl">–</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>

            {mesures.length >= 2 && (() => {
              const avant = mesures[mesures.length - 2];
              const delta = (champ: keyof Mesure) => {
                const v1 = avant[champ] as number | undefined;
                const v2 = derniereMesure[champ] as number | undefined;
                if (!v1 || !v2) return null;
                const d = v2 - v1;
                return d !== 0 ? (
                  <span className={`text-xs font-medium ${d < 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {d > 0 ? '+' : ''}{d.toFixed(1)} cm
                  </span>
                ) : null;
              };
              return (
                <div className="flex gap-2 text-xs text-slate-400">
                  {delta('tourDeTaille') && <span>Tour de taille : {delta('tourDeTaille')}</span>}
                  {delta('hanches') && <span>Hanches : {delta('hanches')}</span>}
                </div>
              );
            })()}
          </div>
        )}
      </Card>

      {/* Courbe de poids */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Courbe de poids</h3>
          <div className="flex gap-1">
            {(['7j', '30j', '90j', 'tout'] as PlageDates[]).map((p) => (
              <BtnPlage key={p} plage={p === 'tout' ? 'Tout' : p} actif={plagePoids === p} onClick={() => setPlagePoids(p)} />
            ))}
          </div>
        </div>
        {donneesGraphique.length < 2 ? (
          <div className="flex flex-col items-center py-8 text-slate-400">
            <Scale size={36} className="mb-2 text-slate-200" strokeWidth={1.5} />
            <p className="text-sm">Ajoutez au moins 2 pesées pour voir la courbe</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={donneesGraphique} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}kg`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={poidsObjectif} stroke="#16a34a" strokeDasharray="6 3" label={{ value: 'Objectif', position: 'right', fontSize: 10, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="poids" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 4, fill: '#14b8a6' }} activeDot={{ r: 6 }} name="poids" />
              <Line type="monotone" dataKey="tendance" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="tendance" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Historique pesées */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Historique pesées</h3>
        {pesees.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucune pesée enregistrée</p>
        ) : (
          <div className="space-y-2">
            {[...pesees].reverse().slice(0, 10).map((p, i) => {
              const precedente = pesees[pesees.length - 1 - i - 1];
              const delta = precedente ? p.poids - precedente.poids : null;
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {format(new Date(p.date), 'd MMMM yyyy', { locale: fr })}
                    </p>
                    {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {delta !== null && (
                      <span className={`text-xs font-medium ${delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                      </span>
                    )}
                    <span className="text-lg font-black text-slate-900 dark:text-white">{p.poids} kg</span>
                    <button onClick={() => setModalSuppression(p.id!)} className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal pesée */}
      <Modal ouvert={modalPesee} onFermer={() => setModalPesee(false)} titre="Nouvelle pesée">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pesez-vous le matin, à jeun et avant de boire, pour plus de cohérence.
          </p>
          <div>
            <label className="label">Poids (kg)</label>
            <input className="input text-3xl font-bold text-center" type="number" step="0.1" placeholder="86.5" value={nouveauPoids} onChange={(e) => setNouveauPoids(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Note (optionnelle)</label>
            <input className="input" placeholder="Ex: Après une bonne nuit…" value={noteP} onChange={(e) => setNoteP(e.target.value)} />
          </div>
          <Button pleine taille="lg" onClick={ajouterPesee} disabled={!nouveauPoids}>
            <Check size={16} /> Enregistrer
          </Button>
        </div>
      </Modal>

      {/* Modal mesures */}
      <Modal ouvert={modalMesure} onFermer={() => setModalMesure(false)} titre="Mesures corporelles">
        <div className="space-y-4">
          <IllustrationMesures />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label text-blue-600">Tour taille (cm)</label>
              <input className="input text-center font-bold" type="number" step="0.5" placeholder="80" value={tourDeTaille} onChange={(e) => setTourDeTaille(e.target.value)} />
            </div>
            <div>
              <label className="label text-purple-600">Hanches (cm)</label>
              <input className="input text-center font-bold" type="number" step="0.5" placeholder="95" value={hanches} onChange={(e) => setHanches(e.target.value)} />
            </div>
            <div>
              <label className="label text-pink-600">Poitrine (cm)</label>
              <input className="input text-center font-bold" type="number" step="0.5" placeholder="90" value={poitrine} onChange={(e) => setPoitrine(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Note (optionnelle)</label>
            <input className="input" placeholder="Ex: Après 3 semaines de sport" value={noteM} onChange={(e) => setNoteM(e.target.value)} />
          </div>
          <Button pleine taille="lg" onClick={ajouterMesure} disabled={!tourDeTaille && !hanches && !poitrine}>
            <Check size={16} /> Enregistrer
          </Button>
        </div>
      </Modal>

      {/* Modal suppression pesée */}
      <Modal ouvert={modalSuppression !== null} onFermer={() => setModalSuppression(null)} titre="Supprimer cette pesée ?">
        <div className="flex gap-2">
          <Button variante="secondary" pleine onClick={() => setModalSuppression(null)}>Annuler</Button>
          <Button variante="danger" pleine onClick={async () => { if (modalSuppression) { await db.pesees.delete(modalSuppression); setModalSuppression(null); } }}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

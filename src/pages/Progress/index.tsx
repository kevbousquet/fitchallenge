import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { db } from '../../db/database';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { estimerDateObjectif } from '../../utils/bmr';
import type { Pesee } from '../../types';

// Moyenne mobile sur N jours
function moyenneMobile(donnees: { date: string; poids: number }[], n: number) {
  return donnees.map((d, i) => {
    const debut = Math.max(0, i - n + 1);
    const fenetre = donnees.slice(debut, i + 1);
    const moy = fenetre.reduce((s, x) => s + x.poids, 0) / fenetre.length;
    return { ...d, tendance: Math.round(moy * 10) / 10 };
  });
}

export function Progress() {
  const { user } = useStore();

  const pesees = useLiveQuery(() => db.pesees.orderBy('date').toArray(), []) ?? [];
  const [modalPesee, setModalPesee] = useState(false);
  const [nouveauPoids, setNouveauPoids] = useState('');
  const [noteP, setNoteP] = useState('');
  const [modalSuppression, setModalSuppression] = useState<number | null>(null);

  const dernierePesee = pesees.length > 0 ? pesees[pesees.length - 1] : null;
  const premierePesee = pesees.length > 0 ? pesees[0] : null;

  const poidsInitial = user?.poidsInitial ?? (premierePesee?.poids ?? 0);
  const poidsObjectif = user?.poidsObjectif ?? 0;
  const poidsActuel = dernierePesee?.poids ?? poidsInitial;
  const perteTotale = poidsInitial - poidsActuel;
  const resteAPerdre = Math.max(poidsActuel - poidsObjectif, 0);

  // Données pour le graphique avec tendance
  const donneesGraphique = moyenneMobile(
    pesees.map((p) => ({ date: p.date, poids: p.poids })),
    7,
  );

  // Estimation date d'atteinte de l'objectif
  let estimationDate: Date | null = null;
  if (pesees.length >= 2) {
    const jours = pesees.length - 1;
    const deltaPoids = pesees[0].poids - poidsActuel;
    const deficitParKg = 7700;
    const deficitJournalier = jours > 0 ? (deltaPoids / jours) * deficitParKg : 0;
    if (deficitJournalier > 50) {
      estimationDate = estimerDateObjectif(poidsActuel, poidsObjectif, deficitJournalier);
    }
  }

  const ajouterPesee = async () => {
    const poids = parseFloat(nouveauPoids);
    if (isNaN(poids)) return;
    await db.pesees.add({
      date: format(new Date(), 'yyyy-MM-dd'),
      poids,
      note: noteP || undefined,
    });
    setNouveauPoids('');
    setNoteP('');
    setModalPesee(false);
  };

  // Formate l'axe X du graphique
  const formatDate = (dateStr: string) => {
    try { return format(new Date(dateStr), 'd MMM', { locale: fr }); }
    catch { return dateStr; }
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-gray-500">{formatDate(label)}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-bold">
            {p.name === 'poids' ? 'Poids' : 'Tendance'} : {p.value} kg
          </p>
        ))}
      </div>
    );
  };

  return (
    <Layout
      titre="Progression"
      actions={
        <Button taille="sm" onClick={() => setModalPesee(true)}>
          ⚖️ Peser
        </Button>
      }
    >
      {/* Résumé */}
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
          <p className="mt-4 text-center font-bold text-white text-lg">🏅 Objectif atteint !</p>
        )}
      </Card>

      {/* Graphique */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Courbe de poids</h3>
        {donneesGraphique.length < 2 ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <span className="text-4xl mb-2">⚖️</span>
            <p className="text-sm">Ajoutez au moins 2 pesées pour voir la courbe</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={donneesGraphique} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}kg`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Ligne objectif */}
              <ReferenceLine
                y={poidsObjectif}
                stroke="#22c55e"
                strokeDasharray="6 3"
                label={{ value: 'Objectif', position: 'right', fontSize: 10, fill: '#22c55e' }}
              />
              {/* Poids réel */}
              <Line
                type="monotone"
                dataKey="poids"
                stroke="#14b8a6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#14b8a6' }}
                activeDot={{ r: 6 }}
                name="poids"
              />
              {/* Tendance lissée */}
              <Line
                type="monotone"
                dataKey="tendance"
                stroke="#22c55e"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                name="tendance"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Historique des pesées */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Historique</h3>
        {pesees.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucune pesée enregistrée</p>
        ) : (
          <div className="space-y-2">
            {[...pesees].reverse().slice(0, 10).map((p, i) => {
              const precedente = pesees[pesees.length - 1 - i - 1];
              const delta = precedente ? p.poids - precedente.poids : null;
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {format(new Date(p.date), 'd MMMM yyyy', { locale: fr })}
                    </p>
                    {p.note && <p className="text-xs text-gray-400">{p.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {delta !== null && (
                      <span className={`text-xs font-medium ${delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg
                      </span>
                    )}
                    <span className="text-lg font-black text-gray-900 dark:text-white">{p.poids} kg</span>
                    <button
                      onClick={() => setModalSuppression(p.id!)}
                      className="p-1.5 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal ajout pesée */}
      <Modal ouvert={modalPesee} onFermer={() => setModalPesee(false)} titre="Nouvelle pesée">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pesez-vous le matin, à jeun et avant de boire, pour plus de cohérence.
          </p>
          <div>
            <label className="label">Poids (kg)</label>
            <input
              className="input text-3xl font-bold text-center"
              type="number"
              step="0.1"
              placeholder="86.5"
              value={nouveauPoids}
              onChange={(e) => setNouveauPoids(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Note (optionnelle)</label>
            <input className="input" placeholder="Ex: Après une bonne nuit…" value={noteP} onChange={(e) => setNoteP(e.target.value)} />
          </div>
          <Button pleine taille="lg" onClick={ajouterPesee} disabled={!nouveauPoids}>
            ✅ Enregistrer
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

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db } from '../../db/database';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Repas, CategoriRepas } from '../../types';

const CATS: { id: CategoriRepas; emoji: string; label: string }[] = [
  { id: 'petit_dejeuner', emoji: '🌅', label: 'Petit-déjeuner' },
  { id: 'dejeuner',       emoji: '☀️', label: 'Déjeuner' },
  { id: 'diner',          emoji: '🌙', label: 'Dîner' },
  { id: 'collation',      emoji: '🍎', label: 'Collation' },
];

const CATS_ORDER: Array<CategoriRepas | 'autre'> = ['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'autre'];

export function Meals() {
  const [dateSelectionnee, setDateSelectionnee] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [repasEdite, setRepasEdite] = useState<Repas | null>(null);
  const [modalSuppression, setModalSuppression] = useState<number | null>(null);

  const { user } = useStore();
  const userId = user?.id ?? 0;

  const repas = useLiveQuery(
    () => userId
      ? db.repas.where('userId').equals(userId).and((r) => r.date === dateSelectionnee).reverse().sortBy('createdAt')
      : Promise.resolve([] as Repas[]),
    [dateSelectionnee, userId],
  ) ?? [];

  const totalCal = repas.reduce((s, r) => s + r.calories, 0);

  const derniersJours = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return { date: format(d, 'yyyy-MM-dd'), label: i === 0 ? "Aujourd'hui" : format(d, 'EEE d', { locale: fr }) };
  });

  const supprimerRepas = async (id: number) => {
    await db.repas.delete(id);
    setModalSuppression(null);
  };

  const sauvegarderEdition = async () => {
    if (!repasEdite?.id) return;
    await db.repas.update(repasEdite.id, {
      nom: repasEdite.nom,
      calories: repasEdite.calories,
      proteines: repasEdite.proteines,
      glucides: repasEdite.glucides,
      lipides: repasEdite.lipides,
      categorie: repasEdite.categorie,
    });
    setRepasEdite(null);
  };

  const sauverFavori = async (r: Repas) => {
    await db.favoris.add({
      userId,
      nom: r.nom,
      calories: r.calories,
      proteines: r.proteines,
      glucides: r.glucides,
      lipides: r.lipides,
      categorie: r.categorie,
    });
  };

  // Grouper par catégorie
  const repasParCat = CATS_ORDER.reduce<Record<string, Repas[]>>((acc, cat) => {
    const liste = repas.filter((r) => (r.categorie ?? 'autre') === cat);
    if (liste.length > 0) acc[cat] = liste;
    return acc;
  }, {});

  const catConfig = (id: string) =>
    CATS.find((c) => c.id === id) ?? { emoji: '🍽️', label: 'Sans catégorie' };

  return (
    <Layout titre="Mes repas">
      {/* Sélecteur de jour */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {derniersJours.map((j) => (
          <button
            key={j.date}
            onClick={() => setDateSelectionnee(j.date)}
            className={`flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
              dateSelectionnee === j.date
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700'
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      {/* Total du jour */}
      {repas.length > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl px-5 py-3 text-white">
          <span className="font-semibold">{repas.length} repas</span>
          <span className="text-xl font-black">{totalCal} kcal</span>
        </div>
      )}

      {/* Liste groupée par catégorie */}
      {repas.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <span className="text-5xl mb-3">🍽️</span>
          <p className="font-medium">Aucun repas ce jour</p>
          <p className="text-sm mt-1">Ajoutez un repas depuis l'écran Accueil</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATS_ORDER.filter((cat) => repasParCat[cat]).map((cat) => (
            <div key={cat}>
              {/* En-tête de catégorie */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base">{catConfig(cat).emoji}</span>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{catConfig(cat).label}</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400">
                  {repasParCat[cat].reduce((s, r) => s + r.calories, 0)} kcal
                </span>
              </div>

              <div className="space-y-3">
                {repasParCat[cat].map((r) => (
                  <Card key={r.id} className="p-0 overflow-hidden">
                    <div className="flex gap-3 p-4">
                      {r.photoBase64 ? (
                        <img
                          src={`data:image/jpeg;base64,${r.photoBase64}`}
                          className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                          alt={r.nom}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl flex-shrink-0">
                          {catConfig(cat).emoji}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{r.nom}</p>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400">{r.calories} kcal</p>
                        {(r.proteines || r.glucides || r.lipides) && (
                          <div className="flex gap-3 text-xs text-gray-400 mt-1">
                            {r.proteines && <span className="text-blue-500">{r.proteines}g prot.</span>}
                            {r.glucides && <span className="text-amber-500">{r.glucides}g gluc.</span>}
                            {r.lipides && <span className="text-red-400">{r.lipides}g lip.</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setRepasEdite({ ...r })}
                          className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => sauverFavori(r)}
                          className="p-2 rounded-xl text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-sm"
                          title="Sauvegarder en favori"
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => setModalSuppression(r.id!)}
                          className="p-2 rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {r.aliments && r.aliments.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 space-y-1">
                        {r.aliments.map((a, i) => (
                          <div key={i} className="flex justify-between text-xs text-gray-500">
                            <span>{a.nom} <span className="text-gray-400">({a.portion})</span></span>
                            <span className="font-medium">{a.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal édition */}
      <Modal ouvert={!!repasEdite} onFermer={() => setRepasEdite(null)} titre="Modifier le repas">
        {repasEdite && (
          <div className="space-y-4">
            {/* Catégorie */}
            <div>
              <label className="label">Moment du repas</label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setRepasEdite({ ...repasEdite, categorie: c.id })}
                    className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-0.5 transition-all ${
                      repasEdite.categorie === c.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span>{c.label.split('-')[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" value={repasEdite.nom} onChange={(e) => setRepasEdite({ ...repasEdite, nom: e.target.value })} />
            </div>
            <div>
              <label className="label">Calories (kcal)</label>
              <input className="input" type="number" value={repasEdite.calories} onChange={(e) => setRepasEdite({ ...repasEdite, calories: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label text-blue-600">Protéines (g)</label>
                <input className="input" type="number" value={repasEdite.proteines ?? ''} onChange={(e) => setRepasEdite({ ...repasEdite, proteines: parseFloat(e.target.value) || undefined })} />
              </div>
              <div>
                <label className="label text-amber-600">Glucides (g)</label>
                <input className="input" type="number" value={repasEdite.glucides ?? ''} onChange={(e) => setRepasEdite({ ...repasEdite, glucides: parseFloat(e.target.value) || undefined })} />
              </div>
              <div>
                <label className="label text-red-500">Lipides (g)</label>
                <input className="input" type="number" value={repasEdite.lipides ?? ''} onChange={(e) => setRepasEdite({ ...repasEdite, lipides: parseFloat(e.target.value) || undefined })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variante="secondary" onClick={() => setRepasEdite(null)}>Annuler</Button>
              <Button pleine onClick={sauvegarderEdition}>Enregistrer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal suppression */}
      <Modal ouvert={modalSuppression !== null} onFermer={() => setModalSuppression(null)} titre="Supprimer ce repas ?">
        <p className="text-gray-500 dark:text-gray-400 mb-5">Cette action est irréversible.</p>
        <div className="flex gap-2">
          <Button variante="secondary" pleine onClick={() => setModalSuppression(null)}>Annuler</Button>
          <Button variante="danger" pleine onClick={() => modalSuppression && supprimerRepas(modalSuppression)}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

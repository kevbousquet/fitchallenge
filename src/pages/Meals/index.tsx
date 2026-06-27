import { useState } from 'react';
import { useDbQuery } from '../../hooks/useDbQuery';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sunrise, Sun, Sunset, Apple, Pencil, Star, Trash2, UtensilsCrossed } from 'lucide-react';
import { getRepasParDate, supprimerRepas as deleteRepas, modifierRepas, ajouterFavori } from '../../lib/db';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { Repas, CategoriRepas } from '../../types';

type CatConfig = { id: CategoriRepas; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string };
type CatFallback = { id: 'autre'; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string };

const CATS: CatConfig[] = [
  { id: 'petit_dejeuner', Icon: Sunrise,          label: 'Petit-déjeuner', color: 'text-amber-500'  },
  { id: 'dejeuner',       Icon: Sun,              label: 'Déjeuner',       color: 'text-orange-500' },
  { id: 'diner',          Icon: Sunset,           label: 'Dîner',          color: 'text-indigo-500' },
  { id: 'collation',      Icon: Apple,            label: 'Collation',      color: 'text-green-600'  },
];

const CAT_FALLBACK: CatFallback = { id: 'autre', Icon: UtensilsCrossed, label: 'Sans catégorie', color: 'text-slate-400' };

const CATS_ORDER: Array<CategoriRepas | 'autre'> = ['petit_dejeuner', 'dejeuner', 'diner', 'collation', 'autre'];

function catConfig(id: string): CatConfig | CatFallback {
  return CATS.find((c) => c.id === id) ?? CAT_FALLBACK;
}

export function Meals() {
  const [dateSelectionnee, setDateSelectionnee] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [repasEdite, setRepasEdite] = useState<Repas | null>(null);
  const [modalSuppression, setModalSuppression] = useState<string | null>(null);

  const { user, refreshDb } = useStore();
  const userId = user?.id ?? '';

  const repas = useDbQuery(
    () => userId ? getRepasParDate(userId, dateSelectionnee) : Promise.resolve([] as Repas[]),
    [] as Repas[],
    [userId, dateSelectionnee],
  );

  const totalCal = repas.reduce((s, r) => s + r.calories, 0);

  const derniersJours = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return { date: format(d, 'yyyy-MM-dd'), label: i === 0 ? "Auj." : format(d, 'EEE d', { locale: fr }) };
  });

  const supprimerRepas = async (id: string) => {
    await deleteRepas(id);
    refreshDb();
    setModalSuppression(null);
  };

  const sauvegarderEdition = async () => {
    if (!repasEdite?.id) return;
    await modifierRepas(repasEdite.id, {
      nom: repasEdite.nom,
      calories: repasEdite.calories,
      proteines: repasEdite.proteines,
      glucides: repasEdite.glucides,
      lipides: repasEdite.lipides,
      categorie: repasEdite.categorie,
    });
    refreshDb();
    setRepasEdite(null);
  };

  const sauverFavori = async (r: Repas) => {
    await ajouterFavori({ userId, nom: r.nom, calories: r.calories, proteines: r.proteines, glucides: r.glucides, lipides: r.lipides, categorie: r.categorie });
  };

  const repasParCat = CATS_ORDER.reduce<Record<string, Repas[]>>((acc, cat) => {
    const liste = repas.filter((r) => (r.categorie ?? 'autre') === cat);
    if (liste.length > 0) acc[cat] = liste;
    return acc;
  }, {});

  return (
    <Layout titre="Mes repas">
      {/* Sélecteur de jour */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {derniersJours.map((j) => (
          <button
            key={j.date}
            onClick={() => setDateSelectionnee(j.date)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              dateSelectionnee === j.date
                ? 'bg-green-600 text-white shadow-md shadow-green-600/30'
                : 'bg-white dark:bg-gray-900 text-slate-500 border border-slate-100 dark:border-gray-800 shadow-sm'
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      {/* Total du jour */}
      {repas.length > 0 && (
        <div className="flex items-center justify-between bg-green-600 rounded-2xl px-5 py-3 text-white shadow-md shadow-green-600/25">
          <span className="font-semibold text-green-100">{repas.length} repas</span>
          <span className="text-2xl font-black tabular-nums">{totalCal} kcal</span>
        </div>
      )}

      {/* Liste groupée */}
      {repas.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <UtensilsCrossed size={40} className="mb-3 text-slate-200" strokeWidth={1.5} />
          <p className="font-semibold">Aucun repas ce jour</p>
          <p className="text-sm mt-1 text-slate-300">Ajoutez un repas depuis l'écran Accueil</p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATS_ORDER.filter((cat) => repasParCat[cat]).map((cat) => {
            const cfg = catConfig(cat);
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <cfg.Icon size={14} className={cfg.color} />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{cfg.label}</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-gray-800" />
                  <span className="text-xs font-semibold text-slate-400 tabular-nums">
                    {repasParCat[cat].reduce((s, r) => s + r.calories, 0)} kcal
                  </span>
                </div>

                <div className="space-y-2">
                  {repasParCat[cat].map((r) => (
                    <Card key={r.id} className="p-0 overflow-hidden">
                      <div className="flex gap-3 p-3">
                        {r.photoBase64 ? (
                          <img src={`data:image/jpeg;base64,${r.photoBase64}`} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt={r.nom} />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-gray-700">
                            <cfg.Icon size={22} className={cfg.color} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">{r.nom}</p>
                          <p className="text-xl font-black text-green-600 dark:text-green-400 tabular-nums leading-tight">{r.calories} kcal</p>
                          {(r.proteines || r.glucides || r.lipides) && (
                            <div className="flex gap-2 text-xs mt-1">
                              {r.proteines && <span className="text-blue-500 font-medium tabular-nums">{r.proteines}g P</span>}
                              {r.glucides  && <span className="text-amber-500 font-medium tabular-nums">{r.glucides}g G</span>}
                              {r.lipides   && <span className="text-red-400 font-medium tabular-nums">{r.lipides}g L</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <button onClick={() => setRepasEdite({ ...r })} className="p-2 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors" title="Modifier">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => sauverFavori(r)} className="p-2 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Favori">
                            <Star size={14} />
                          </button>
                          <button onClick={() => setModalSuppression(r.id!)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {r.aliments && r.aliments.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-gray-800 px-3 py-2 space-y-1">
                          {r.aliments.map((a, i) => (
                            <div key={i} className="flex justify-between text-xs text-slate-500">
                              <span>{a.nom} <span className="text-slate-300">({a.portion})</span></span>
                              <span className="font-semibold tabular-nums">{a.calories} kcal</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal édition */}
      <Modal ouvert={!!repasEdite} onFermer={() => setRepasEdite(null)} titre="Modifier le repas">
        {repasEdite && (
          <div className="space-y-4">
            <div>
              <label className="label">Moment du repas</label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setRepasEdite({ ...repasEdite, categorie: c.id })}
                    className={`py-2.5 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-all ${
                      repasEdite.categorie === c.id
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-gray-800 text-slate-500'
                    }`}
                  >
                    <c.Icon size={15} className={repasEdite.categorie === c.id ? 'text-white' : c.color} />
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
        <p className="text-slate-500 dark:text-slate-400 mb-5 text-sm">Cette action est irréversible.</p>
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

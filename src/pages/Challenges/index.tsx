import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db } from '../../db/database';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { calculerStreak, journeesPalfaitesDesSemaine } from '../../utils/streak';
import { BADGES_CONFIG, evaluerBadges } from '../../utils/badges';
import type { BadgeCle } from '../../types';

export function Challenges() {
  const { user } = useStore();

  const journees    = useLiveQuery(() => db.journees.toArray(), []) ?? [];
  const pesees      = useLiveQuery(() => db.pesees.orderBy('date').toArray(), []) ?? [];
  const badgesDB    = useLiveQuery(() => db.badges.toArray(), []) ?? [];
  const repasPhotos = useLiveQuery(() => db.repas.filter((r) => !!r.photoBase64).count(), []) ?? 0;

  // Semaine courante
  const today = new Date();
  const debutSemaine = startOfWeek(today, { weekStartsOn: 1 });
  const finSemaine = endOfWeek(today, { weekStartsOn: 1 });
  const debutSemaineStr = format(debutSemaine, 'yyyy-MM-dd');

  // Hook au niveau composant (pas imbriqué dans JSX)
  const repasSemaine = useLiveQuery(
    () => db.repas.where('date').aboveOrEqual(debutSemaineStr).toArray(),
    [debutSemaineStr],
  ) ?? [];

  const streak = calculerStreak(journees);
  const parfaitesSemaine = journeesPalfaitesDesSemaine(journees);
  const poidsInitial = user?.poidsInitial ?? 0;
  const poidsObjectif = user?.poidsObjectif ?? 0;

  const clesDebloquees = new Set<BadgeCle>(badgesDB.map((b) => b.cle as BadgeCle));
  const tousLesBadges = Object.values(BADGES_CONFIG);

  // Déblocage automatique des nouveaux badges (dans un effect, jamais pendant le rendu)
  useEffect(() => {
    if (!journees.length && !pesees.length) return;
    const nouveauxBadges = evaluerBadges(journees, pesees, poidsInitial, poidsObjectif, badgesDB, repasPhotos);
    if (nouveauxBadges.length === 0) return;
    const todayStr = format(today, 'yyyy-MM-dd');
    nouveauxBadges.forEach((cle) => {
      db.badges.add({ cle, debloqueLeDate: todayStr }).catch(() => {});
    });
  }, [journees, pesees, badgesDB, repasPhotos, poidsInitial, poidsObjectif]);

  const joursSemaine = eachDayOfInterval({ start: debutSemaine, end: finSemaine });
  const parDate = new Map(journees.map((j) => [j.date, j]));

  const totalSport = journees.filter((j) => j.sportFait).length;
  const journeesSemaine = journees.filter((j) => j.date >= debutSemaineStr);
  const sportSemaine = journeesSemaine.filter((j) => j.sportFait).length;

  const calMoyenne = repasSemaine.length > 0
    ? Math.round(repasSemaine.reduce((s, r) => s + r.calories, 0) / Math.max(journeesSemaine.length, 1))
    : 0;

  const messages = [
    streak >= 7 ? '🔥 Série de 7 jours, bravo !' : null,
    sportSemaine >= 3 ? '💪 Objectif sport atteint !' : null,
    parfaitesSemaine >= 5 ? '⭐ Semaine exceptionnelle !' : null,
    calMoyenne > 0 && calMoyenne <= (user?.objectifCalories ?? 9999)
      ? '🎯 Déficit respecté en moyenne !'
      : null,
  ].filter(Boolean) as string[];

  return (
    <Layout titre="Challenges & Badges">
      {/* Streak principal */}
      <Card gradient className="text-center py-6">
        <div className="text-6xl font-black">🔥 {streak}</div>
        <p className="text-green-100 mt-1 font-medium">jours de série en cours</p>
        {streak === 0 && (
          <p className="text-green-200 text-sm mt-2">
            Terminez aujourd&apos;hui pour démarrer une série !
          </p>
        )}
      </Card>

      {/* Calendrier de la semaine */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Cette semaine</h3>
        <div className="grid grid-cols-7 gap-1">
          {joursSemaine.map((jour) => {
            const dateStr = format(jour, 'yyyy-MM-dd');
            const j = parDate.get(dateStr);
            const estAujourdhui = dateStr === format(today, 'yyyy-MM-dd');
            const estFutur = jour > today;

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase">
                  {format(jour, 'EEE', { locale: fr }).charAt(0)}
                </span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  estFutur
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300'
                    : j?.parfaite
                    ? 'bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-md'
                    : estAujourdhui
                    ? 'border-2 border-green-500 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {estFutur ? '-' : j?.parfaite ? '✓' : format(jour, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
          <span className="font-bold text-green-600 dark:text-green-400">{parfaitesSemaine}</span> / 7 journées parfaites
        </div>
      </Card>

      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Séances de sport', valeur: totalSport, emoji: '🏋️' },
          { label: 'Jours parfaits',   valeur: journees.filter((j) => j.parfaite).length, emoji: '⭐' },
          { label: 'Repas analysés',   valeur: repasPhotos, emoji: '📸' },
          { label: 'Streak actuel',    valeur: streak, emoji: '🔥' },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className="text-3xl">{s.emoji}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{s.valeur}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Badges</h3>
        <div className="grid grid-cols-3 gap-3">
          {tousLesBadges.map((badge) => {
            const debloque = clesDebloquees.has(badge.cle);
            return (
              <div
                key={badge.cle}
                className={`flex flex-col items-center p-3 rounded-2xl text-center transition-all ${
                  debloque
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-700/50'
                    : 'bg-gray-50 dark:bg-gray-800/50 opacity-40'
                }`}
              >
                <span className={`text-3xl ${!debloque ? 'grayscale' : ''}`}>{badge.emoji}</span>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 leading-tight">{badge.nom}</p>
                {debloque && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{badge.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Récap hebdomadaire */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
          📊 Récap de la semaine
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
              <p className="text-gray-400 text-xs">Cal. moyennes / jour</p>
              <p className="font-bold text-gray-900 dark:text-white">{calMoyenne || '–'} kcal</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
              <p className="text-gray-400 text-xs">Séances de sport</p>
              <p className="font-bold text-gray-900 dark:text-white">{sportSemaine} / 3 obj.</p>
            </div>
          </div>
          {messages.length > 0 ? (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-3 space-y-1">
              {messages.map((m, i) => (
                <p key={i} className="text-sm text-green-700 dark:text-green-300 font-medium">{m}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Continuez vos efforts, vous pouvez le faire ! 💪
            </p>
          )}
        </div>
      </Card>
    </Layout>
  );
}

import { useEffect } from 'react';
import { useDbQuery } from '../../hooks/useDbQuery';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Flame, Check, BarChart2, Dumbbell, Star, Camera, Target,
  TrendingDown, Trophy, Gem, Sparkles, Zap,
} from 'lucide-react';
import { getToutesJournees, getPesees, getBadges, ajouterBadge, getNbRepasAvecPhoto, getRepasRange } from '../../lib/db';
import { useStore } from '../../store/useStore';
import { Layout } from '../../components/layout/Layout';
import { Card } from '../../components/ui/Card';
import { calculerStreak, journeesPalfaitesDesSemaine } from '../../utils/streak';
import { BADGES_CONFIG, evaluerBadges } from '../../utils/badges';
import type { BadgeCle, Journee, Pesee, BadgeDebloque, Repas } from '../../types';

type IconComp = React.ComponentType<{ size?: number; className?: string }>;

const BADGE_ICONS: Record<BadgeCle, { Icon: IconComp; color: string; bg: string }> = {
  premiere_connexion:        { Icon: Sparkles,     color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30'  },
  premiere_journee_parfaite: { Icon: Star,         color: 'text-amber-500',  bg: 'bg-amber-100 dark:bg-amber-900/30'   },
  premiere_semaine_parfaite: { Icon: Trophy,       color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-900/30'   },
  streak_7:                  { Icon: Flame,        color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  streak_30:                 { Icon: Gem,          color: 'text-cyan-500',   bg: 'bg-cyan-100 dark:bg-cyan-900/30'     },
  moins_1kg:                 { Icon: TrendingDown, color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30'   },
  moins_5kg:                 { Icon: Target,       color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30'   },
  moins_10kg:                { Icon: Zap,          color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  objectif_atteint:          { Icon: Trophy,       color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/30'   },
  sport_10:                  { Icon: Dumbbell,     color: 'text-blue-500',   bg: 'bg-blue-100 dark:bg-blue-900/30'     },
  sport_30:                  { Icon: Dumbbell,     color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  photos_10:                 { Icon: Camera,       color: 'text-pink-500',   bg: 'bg-pink-100 dark:bg-pink-900/30'     },
};

export function Challenges() {
  const { user, refreshDb } = useStore();
  const userId = user?.id ?? '';

  const journees    = useDbQuery(() => userId ? getToutesJournees(userId) : Promise.resolve([] as Journee[]), [] as Journee[], [userId]);
  const pesees      = useDbQuery(() => userId ? getPesees(userId) : Promise.resolve([] as Pesee[]), [] as Pesee[], [userId]);
  const badgesDB    = useDbQuery(() => userId ? getBadges(userId) : Promise.resolve([] as BadgeDebloque[]), [] as BadgeDebloque[], [userId]);
  const repasPhotos = useDbQuery(() => userId ? getNbRepasAvecPhoto(userId) : Promise.resolve(0), 0, [userId]);

  const today = new Date();
  const debutSemaine = startOfWeek(today, { weekStartsOn: 1 });
  const finSemaine = endOfWeek(today, { weekStartsOn: 1 });
  const debutSemaineStr = format(debutSemaine, 'yyyy-MM-dd');
  const finSemaineStr = format(finSemaine, 'yyyy-MM-dd');

  const repasSemaine = useDbQuery(
    () => userId ? getRepasRange(userId, debutSemaineStr, finSemaineStr) : Promise.resolve([] as Repas[]),
    [] as Repas[],
    [userId, debutSemaineStr, finSemaineStr],
  );

  const streak = calculerStreak(journees);
  const parfaitesSemaine = journeesPalfaitesDesSemaine(journees);
  const poidsInitial = user?.poidsInitial ?? 0;
  const poidsObjectif = user?.poidsObjectif ?? 0;

  const clesDebloquees = new Set<BadgeCle>(badgesDB.map((b) => b.cle as BadgeCle));
  const tousLesBadges = Object.values(BADGES_CONFIG);

  useEffect(() => {
    if (!journees.length && !pesees.length) return;
    const nouveauxBadges = evaluerBadges(journees, pesees, poidsInitial, poidsObjectif, badgesDB, repasPhotos);
    if (nouveauxBadges.length === 0) return;
    const todayStr = format(today, 'yyyy-MM-dd');
    Promise.all(nouveauxBadges.map((cle) =>
      ajouterBadge({ userId, cle, debloqueLeDate: todayStr })
    )).then(() => refreshDb()).catch(() => {});
  }, [journees, pesees, badgesDB, repasPhotos, poidsInitial, poidsObjectif]);

  const joursSemaine = eachDayOfInterval({ start: debutSemaine, end: finSemaine });
  const parDate = new Map(journees.map((j) => [j.date, j]));

  const totalSport = journees.filter((j) => j.sportFait).length;
  const journeesSemaine = journees.filter((j) => j.date >= debutSemaineStr && j.date <= finSemaineStr);
  const sportSemaine = journeesSemaine.filter((j) => j.sportFait).length;

  const joursAvecDonnees = journeesSemaine.length || 1;
  const calMoyenne = repasSemaine.length > 0
    ? Math.round(repasSemaine.reduce((s, r) => s + r.calories, 0) / joursAvecDonnees)
    : 0;

  const peseesSemaine = pesees.filter((p) => p.date >= debutSemaineStr && p.date <= finSemaineStr);
  const peseesSemainePrecedente = pesees.filter((p) => {
    const debutPrec = format(subDays(debutSemaine, 7), 'yyyy-MM-dd');
    return p.date >= debutPrec && p.date < debutSemaineStr;
  });
  const poidsDebutSemaine = peseesSemainePrecedente.length > 0
    ? peseesSemainePrecedente[peseesSemainePrecedente.length - 1].poids
    : peseesSemaine.length > 0 ? peseesSemaine[0].poids : null;
  const poidsFinSemaine = peseesSemaine.length > 0 ? peseesSemaine[peseesSemaine.length - 1].poids : null;
  const deltaPoidsStr = poidsDebutSemaine && poidsFinSemaine
    ? (() => { const d = poidsFinSemaine - poidsDebutSemaine; return `${d > 0 ? '+' : ''}${d.toFixed(1)} kg`; })()
    : null;
  const deltaCouleur = deltaPoidsStr?.startsWith('-') ? 'text-green-600 dark:text-green-400' : deltaPoidsStr?.startsWith('+') ? 'text-red-500' : 'text-gray-500';

  const tauxChallenges = journeesSemaine.length > 0
    ? Math.round((journeesSemaine.filter((j) => j.parfaite).length / journeesSemaine.length) * 100)
    : 0;

  const deficitRespect = calMoyenne > 0 && calMoyenne <= (user?.objectifCalories ?? 9999);

  type Msg = { Icon: IconComp; texte: string };
  const msgs: Msg[] = [];
  if (streak >= 7) msgs.push({ Icon: Flame, texte: 'Série de 7 jours, continuez !' });
  if (sportSemaine >= 3) msgs.push({ Icon: Dumbbell, texte: 'Objectif sport atteint !' });
  if (parfaitesSemaine >= 5) msgs.push({ Icon: Star, texte: 'Semaine exceptionnelle !' });
  if (deficitRespect) msgs.push({ Icon: Target, texte: 'Déficit calorique respecté !' });
  if (deltaPoidsStr?.startsWith('-')) msgs.push({ Icon: TrendingDown, texte: 'Bravo, vous avez perdu du poids cette semaine !' });

  const statsGlobales: Array<{ label: string; valeur: number; Icon: IconComp; color: string }> = [
    { label: 'Séances de sport', valeur: totalSport,                                Icon: Dumbbell, color: 'text-blue-500'   },
    { label: 'Jours parfaits',   valeur: journees.filter((j) => j.parfaite).length, Icon: Star,     color: 'text-amber-500'  },
    { label: 'Repas analysés',   valeur: repasPhotos,                               Icon: Camera,   color: 'text-pink-500'   },
    { label: 'Streak actuel',    valeur: streak,                                    Icon: Flame,    color: 'text-orange-500' },
  ];

  return (
    <Layout titre="Challenges & Badges">
      {/* Streak principal */}
      <Card gradient className="text-center py-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Flame size={30} className="text-white" />
          </div>
          <span className="text-6xl font-black text-white tabular-nums">{streak}</span>
        </div>
        <p className="text-green-100 mt-3 font-medium">jours de série en cours</p>
        {streak === 0 && (
          <p className="text-green-200 text-sm mt-2">Terminez aujourd&apos;hui pour démarrer une série !</p>
        )}
      </Card>

      {/* Calendrier de la semaine */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Cette semaine</h3>
        <div className="grid grid-cols-7 gap-1">
          {joursSemaine.map((jour) => {
            const dateStr = format(jour, 'yyyy-MM-dd');
            const j = parDate.get(dateStr);
            const estAujourdhui = dateStr === format(today, 'yyyy-MM-dd');
            const estFutur = jour > today;

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium uppercase">
                  {format(jour, 'EEE', { locale: fr }).charAt(0)}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  estFutur
                    ? 'bg-slate-100 dark:bg-gray-800 text-slate-300'
                    : j?.parfaite
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/30'
                    : estAujourdhui
                    ? 'border-2 border-green-500 text-green-600 dark:text-green-400'
                    : 'bg-slate-100 dark:bg-gray-800 text-slate-400'
                }`}>
                  {estFutur ? '–' : j?.parfaite ? <Check size={14} /> : format(jour, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-green-600 dark:text-green-400">{parfaitesSemaine}</span> / 7 journées parfaites
        </div>
      </Card>

      {/* Bilan de la semaine */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Bilan de la semaine</h3>
          </div>
          <span className="text-xs text-slate-400">
            {format(debutSemaine, 'd MMM', { locale: fr })} – {format(finSemaine, 'd MMM', { locale: fr })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 mb-1">Calories moy. / jour</p>
            <p className={`text-2xl font-black ${deficitRespect ? 'text-green-600 dark:text-green-400' : calMoyenne > 0 ? 'text-red-500' : 'text-slate-400'}`}>
              {calMoyenne || '–'}
            </p>
            {calMoyenne > 0 && (
              <p className="text-xs text-slate-400">
                obj. {user?.objectifCalories} kcal {deficitRespect ? <Check size={10} className="inline text-green-500" /> : '✗'}
              </p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 mb-1">Évolution du poids</p>
            <p className={`text-2xl font-black ${deltaPoidsStr ? deltaCouleur : 'text-slate-400'}`}>
              {deltaPoidsStr ?? '–'}
            </p>
            {poidsFinSemaine && <p className="text-xs text-slate-400">{poidsFinSemaine} kg actuellement</p>}
          </div>

          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 mb-1">Séances de sport</p>
            <p className={`text-2xl font-black ${sportSemaine >= 3 ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {sportSemaine}
            </p>
            <p className="text-xs text-slate-400">objectif 3 {sportSemaine >= 3 && <Check size={10} className="inline text-green-500" />}</p>
          </div>

          <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-3">
            <p className="text-xs text-slate-400 mb-1">Taux de réussite</p>
            <p className={`text-2xl font-black ${tauxChallenges >= 70 ? 'text-green-600 dark:text-green-400' : tauxChallenges >= 40 ? 'text-amber-500' : 'text-slate-400'}`}>
              {journeesSemaine.length ? `${tauxChallenges}%` : '–'}
            </p>
            <p className="text-xs text-slate-400">journées parfaites</p>
          </div>
        </div>

        {msgs.length > 0 ? (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-3 space-y-2">
            {msgs.map(({ Icon, texte }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">{texte}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic text-center">Continuez vos efforts, vous pouvez le faire !</p>
        )}
      </Card>

      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        {statsGlobales.map((s) => (
          <Card key={s.label} className="text-center py-4">
            <div className="flex justify-center mb-2">
              <s.Icon size={22} className={s.color} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.valeur}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4">Badges</h3>
        <div className="grid grid-cols-3 gap-3">
          {tousLesBadges.map((badge) => {
            const debloque = clesDebloquees.has(badge.cle);
            const cfg = BADGE_ICONS[badge.cle];
            return (
              <div
                key={badge.cle}
                className={`flex flex-col items-center p-3 rounded-2xl text-center transition-all ${
                  debloque
                    ? 'border border-amber-200 dark:border-amber-700/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20'
                    : 'bg-slate-50 dark:bg-gray-800/50 opacity-35'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${debloque ? cfg.bg : 'bg-slate-100 dark:bg-gray-700'}`}>
                  <cfg.Icon size={20} className={debloque ? cfg.color : 'text-slate-300 dark:text-gray-600'} />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{badge.nom}</p>
                {debloque && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{badge.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </Layout>
  );
}

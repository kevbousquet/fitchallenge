import type { BadgeCle, BadgeInfo, Journee, Pesee, BadgeDebloque } from '../types';
import { calculerStreak } from './streak';

export const BADGES_CONFIG: Record<BadgeCle, BadgeInfo> = {
  premiere_connexion:       { cle: 'premiere_connexion',       nom: 'Premier pas',           description: 'Bienvenue dans FitChallenge !',              emoji: '👋' },
  premiere_journee_parfaite:{ cle: 'premiere_journee_parfaite',nom: 'Journée parfaite',       description: 'Première journée 100% réussie',               emoji: '⭐' },
  premiere_semaine_parfaite:{ cle: 'premiere_semaine_parfaite',nom: 'Semaine parfaite',       description: '7 jours parfaits consécutifs',                emoji: '🏆' },
  streak_7:                 { cle: 'streak_7',                 nom: 'Série de 7',             description: '7 jours de suite sans faillir',              emoji: '🔥' },
  streak_30:                { cle: 'streak_30',                nom: 'Mois de feu',            description: '30 jours consécutifs parfaits',               emoji: '💎' },
  moins_1kg:                { cle: 'moins_1kg',                nom: '-1 kg',                  description: 'Premier kilo perdu !',                        emoji: '💪' },
  moins_5kg:                { cle: 'moins_5kg',                nom: '-5 kg',                  description: 'Cinq kilos de moins, bravo !',                emoji: '🎯' },
  moins_10kg:               { cle: 'moins_10kg',               nom: '-10 kg',                 description: 'Dix kilos perdus, incroyable !',              emoji: '🌟' },
  objectif_atteint:         { cle: 'objectif_atteint',         nom: 'Objectif atteint',       description: 'Poids cible atteint !',                       emoji: '🏅' },
  sport_10:                 { cle: 'sport_10',                 nom: '10 séances',             description: '10 séances de sport accomplies',             emoji: '🏃' },
  sport_30:                 { cle: 'sport_30',                 nom: '30 séances',             description: '30 séances de sport accomplies',             emoji: '🦾' },
  photos_10:                { cle: 'photos_10',                nom: 'Gourmet conscient',      description: '10 repas analysés par photo',                emoji: '📸' },
};

// Détermine quels badges devraient être débloqués selon l'état actuel
export function evaluerBadges(
  journees: Journee[],
  pesees: Pesee[],
  poidsInitial: number,
  poidsObjectif: number,
  badgesDejaDebloques: BadgeDebloque[],
  repasAvecPhoto: number,
): BadgeCle[] {
  const debloques = new Set(badgesDejaDebloques.map((b) => b.cle));
  const nouveaux: BadgeCle[] = [];

  const verifier = (cle: BadgeCle, condition: boolean) => {
    if (condition && !debloques.has(cle)) nouveaux.push(cle);
  };

  const streak = calculerStreak(journees);
  const seanceSport = journees.filter((j) => j.sportFait).length;
  const dernierPoids = pesees.length > 0 ? pesees[pesees.length - 1].poids : poidsInitial;
  const perteKg = poidsInitial - dernierPoids;
  const parfaites = journees.filter((j) => j.parfaite).length;

  verifier('premiere_connexion',        true);
  verifier('premiere_journee_parfaite', parfaites >= 1);
  verifier('premiere_semaine_parfaite', streak >= 7);
  verifier('streak_7',                  streak >= 7);
  verifier('streak_30',                 streak >= 30);
  verifier('moins_1kg',                 perteKg >= 1);
  verifier('moins_5kg',                 perteKg >= 5);
  verifier('moins_10kg',                perteKg >= 10);
  verifier('objectif_atteint',          dernierPoids <= poidsObjectif);
  verifier('sport_10',                  seanceSport >= 10);
  verifier('sport_30',                  seanceSport >= 30);
  verifier('photos_10',                 repasAvecPhoto >= 10);

  return nouveaux;
}

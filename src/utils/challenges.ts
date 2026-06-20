import type { ChallengeConfig, ChallengeId } from '../types';

export const CHALLENGES: Record<ChallengeId, ChallengeConfig> = {
  deficit_calorique: {
    id: 'deficit_calorique',
    label: 'Déficit calorique',
    description: "Rester sous l'objectif calorique du jour",
    emoji: '🎯',
    type: 'auto',
  },
  pas: {
    id: 'pas',
    label: 'Nombre de pas',
    description: 'Atteindre votre objectif de pas quotidien',
    emoji: '👣',
    type: 'counter',
  },
  sport: {
    id: 'sport',
    label: 'Séance de sport',
    description: "Faire au moins une séance d'activité physique",
    emoji: '🏋️',
    type: 'detail',
  },
  hydratation: {
    id: 'hydratation',
    label: 'Hydratation',
    description: "Boire suffisamment d'eau dans la journée",
    emoji: '💧',
    type: 'counter',
  },
  sommeil: {
    id: 'sommeil',
    label: 'Sommeil 7h+',
    description: 'Dormir au moins 7 heures cette nuit',
    emoji: '😴',
    type: 'check',
  },
  pas_de_grignotage: {
    id: 'pas_de_grignotage',
    label: 'Pas de grignotage',
    description: 'Résister aux grignotages entre les repas',
    emoji: '🚫',
    type: 'check',
  },
  pas_alcool: {
    id: 'pas_alcool',
    label: 'Sans alcool',
    description: "Journée sans consommation d'alcool",
    emoji: '🍵',
    type: 'check',
  },
  pas_sucre: {
    id: 'pas_sucre',
    label: 'Sans sucre ajouté',
    description: 'Éviter les sucres ajoutés dans la journée',
    emoji: '🍬',
    type: 'check',
  },
  legumes: {
    id: 'legumes',
    label: 'Légumes à chaque repas',
    description: 'Inclure des légumes dans chaque repas principal',
    emoji: '🥦',
    type: 'check',
  },
};

export const TOUS_LES_CHALLENGES = Object.values(CHALLENGES);

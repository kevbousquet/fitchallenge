// ─── Types principaux de FitChallenge ───────────────────────────────────────

export interface User {
  id?: number;
  prenom: string;
  sexe: 'homme' | 'femme';
  age: number;
  taille: number;          // cm
  poidsInitial: number;    // kg
  poidsObjectif: number;   // kg
  dateCible?: string;      // ISO date YYYY-MM-DD
  objectifCalories: number; // kcal/jour
  objectifPas: number;     // ex. 8000
  objectifVerres: number;  // ex. 8
  challengesActifs: ChallengeId[];
  themeSombre: boolean;
  createdAt: string;
}

export type ChallengeId =
  | 'deficit_calorique'
  | 'pas'
  | 'sport'
  | 'hydratation'
  | 'sommeil'
  | 'pas_de_grignotage'
  | 'pas_alcool'
  | 'pas_sucre'
  | 'legumes';

export interface ChallengeConfig {
  id: ChallengeId;
  label: string;
  description: string;
  emoji: string;
  type: 'auto' | 'check' | 'counter' | 'detail';
}

export interface AlimentDetail {
  nom: string;
  portion: string;
  calories: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
}

export interface Repas {
  id?: number;
  date: string;            // YYYY-MM-DD
  nom: string;
  calories: number;
  proteines?: number;      // g
  glucides?: number;       // g
  lipides?: number;        // g
  photoBase64?: string;
  aliments?: AlimentDetail[];
  createdAt: string;
}

export interface Journee {
  id?: number;
  date: string;            // YYYY-MM-DD (unique)
  pas: number;
  verresBus: number;
  sportFait: boolean;
  typeSport?: 'cardio' | 'musculation' | 'marche' | 'autre';
  dureeSport?: number;     // minutes
  sommeilOk: boolean;
  pasDeGrignotage: boolean;
  pasDAlcool: boolean;
  pasDeSucre: boolean;
  legumesMange: boolean;
  parfaite: boolean;
  updatedAt: string;
}

export interface Pesee {
  id?: number;
  date: string;            // YYYY-MM-DD
  poids: number;           // kg
  note?: string;
}

export type BadgeCle =
  | 'premiere_connexion'
  | 'premiere_journee_parfaite'
  | 'premiere_semaine_parfaite'
  | 'streak_7'
  | 'streak_30'
  | 'moins_1kg'
  | 'moins_5kg'
  | 'moins_10kg'
  | 'objectif_atteint'
  | 'sport_10'
  | 'sport_30'
  | 'photos_10';

export interface BadgeInfo {
  cle: BadgeCle;
  nom: string;
  description: string;
  emoji: string;
}

export interface BadgeDebloque {
  id?: number;
  cle: BadgeCle;
  debloqueLeDate: string;
}

// Résultat de l'analyse Claude d'un repas
export interface AnalyseRepas {
  aliments: AlimentDetail[];
  caloriesTotal: number;
  proteinesTotal: number;
  glucidesTotal: number;
  lipidesTotal: number;
  description: string;
}

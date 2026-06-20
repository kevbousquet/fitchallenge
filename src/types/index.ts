// ─── Types principaux de FitChallenge ───────────────────────────────────────

export type CategoriRepas = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation';

export interface User {
  id?: number;
  prenom: string;
  sexe: 'homme' | 'femme';
  age: number;
  taille: number;
  poidsInitial: number;
  poidsObjectif: number;
  dateCible?: string;
  objectifCalories: number;
  objectifPas: number;
  objectifVerres: number;
  challengesActifs: ChallengeId[];
  themeSombre: boolean;
  createdAt: string;
  notifRepasActif?: boolean;
  notifRepasHeure?: string;
  notifPeseeActif?: boolean;
  notifPeseeHeure?: string;
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
  userId: number;
  date: string;
  nom: string;
  calories: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
  photoBase64?: string;
  aliments?: AlimentDetail[];
  categorie?: CategoriRepas;
  createdAt: string;
}

export interface FavoriRepas {
  id?: number;
  userId: number;
  nom: string;
  calories: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
  categorie?: CategoriRepas;
}

export interface Mesure {
  id?: number;
  userId: number;
  date: string;
  tourDeTaille?: number;
  hanches?: number;
  poitrine?: number;
  note?: string;
}

export interface Journee {
  id?: number;
  userId: number;
  date: string;
  pas: number;
  verresBus: number;
  sportFait: boolean;
  typeSport?: 'cardio' | 'musculation' | 'marche' | 'autre';
  dureeSport?: number;
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
  userId: number;
  date: string;
  poids: number;
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
  userId: number;
  cle: BadgeCle;
  debloqueLeDate: string;
}

export interface AnalyseRepas {
  aliments: AlimentDetail[];
  caloriesTotal: number;
  proteinesTotal: number;
  glucidesTotal: number;
  lipidesTotal: number;
  description: string;
}

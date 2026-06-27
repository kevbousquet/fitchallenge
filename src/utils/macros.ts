import type { User } from '../types';

export type ObjectifType = 'perte_de_poids' | 'prise_de_masse' | 'maintien';

export interface ObjectifsMacros {
  proteines: number;
  glucides: number;
  lipides: number;
  objectifType: ObjectifType;
}

export function determinerObjectifType(user: User): ObjectifType {
  const diff = user.poidsObjectif - user.poidsInitial;
  if (diff < -0.5) return 'perte_de_poids';
  if (diff > 0.5)  return 'prise_de_masse';
  return 'maintien';
}

export function calculerObjectifsMacros(user: User): ObjectifsMacros {
  const cal = user.objectifCalories;
  const objectifType = determinerObjectifType(user);

  // Répartition calorique par objectif (P=protéines 4kcal/g, G=glucides 4kcal/g, L=lipides 9kcal/g)
  const ratios: Record<ObjectifType, { p: number; g: number; l: number }> = {
    perte_de_poids: { p: 0.32, g: 0.38, l: 0.30 }, // protéines élevées pour préserver le muscle
    prise_de_masse: { p: 0.28, g: 0.47, l: 0.25 }, // glucides élevés pour l'énergie
    maintien:       { p: 0.25, g: 0.50, l: 0.25 }, // équilibré
  };

  const r = ratios[objectifType];

  return {
    proteines: Math.round((cal * r.p) / 4),
    glucides:  Math.round((cal * r.g) / 4),
    lipides:   Math.round((cal * r.l) / 9),
    objectifType,
  };
}

export const OBJECTIF_LABELS: Record<ObjectifType, string> = {
  perte_de_poids: 'Perte de poids',
  prise_de_masse: 'Prise de masse',
  maintien:       'Maintien',
};

// Utilitaires pour les stats hebdo/mensuel/annuel
export interface StatsMacros {
  proteinesMoy: number;
  glucidesMoy:  number;
  lipidesMoy:   number;
  caloriesMoy:  number;
  nbJours:      number;
}

export function calculerStatsMacros(
  repasParJour: Record<string, { proteines: number; glucides: number; lipides: number; calories: number }[]>,
): StatsMacros {
  const jours = Object.values(repasParJour);
  if (jours.length === 0) return { proteinesMoy: 0, glucidesMoy: 0, lipidesMoy: 0, caloriesMoy: 0, nbJours: 0 };

  const totaux = jours.map((repas) =>
    repas.reduce(
      (acc, r) => ({
        proteines: acc.proteines + r.proteines,
        glucides:  acc.glucides  + r.glucides,
        lipides:   acc.lipides   + r.lipides,
        calories:  acc.calories  + r.calories,
      }),
      { proteines: 0, glucides: 0, lipides: 0, calories: 0 },
    ),
  );

  const n = totaux.length;
  return {
    proteinesMoy: Math.round(totaux.reduce((s, j) => s + j.proteines, 0) / n),
    glucidesMoy:  Math.round(totaux.reduce((s, j) => s + j.glucides,  0) / n),
    lipidesMoy:   Math.round(totaux.reduce((s, j) => s + j.lipides,   0) / n),
    caloriesMoy:  Math.round(totaux.reduce((s, j) => s + j.calories,  0) / n),
    nbJours: n,
  };
}

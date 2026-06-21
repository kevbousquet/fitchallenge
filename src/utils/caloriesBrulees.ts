import type { Journee, User } from '../types';

const MET: Record<string, number> = {
  cardio:      7.0,
  musculation: 4.0,
  marche:      3.5,
  autre:       5.0,
};

export interface DepenseCaloriques {
  depensePas: number;
  depenseSport: number;
  total: number;
}

export function calculerCaloriesBrulees(
  journee: Journee | null,
  user: User | null,
): DepenseCaloriques {
  const poids = user?.poidsInitial ?? 70;

  // Marche : durée estimée = pas / 120 pas·min⁻¹, MET 3.5
  const minutesMarche = (journee?.pas ?? 0) / 120;
  const depensePas = Math.round(3.5 * poids * 0.0175 * minutesMarche);

  // Sport enregistré : MET × poids × 0.0175 × durée (min)
  const metSport = MET[journee?.typeSport ?? 'autre'] ?? 5.0;
  const depenseSport = journee?.sportFait
    ? Math.round(metSport * poids * 0.0175 * (journee.dureeSport ?? 0))
    : 0;

  return { depensePas, depenseSport, total: depensePas + depenseSport };
}

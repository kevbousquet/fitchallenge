import { format, subDays } from 'date-fns';
import type { Journee } from '../types';

// Calcule le streak actuel (jours consécutifs parfaits jusqu'à hier inclus)
export function calculerStreak(journees: Journee[]): number {
  const parDate = new Map(journees.map((j) => [j.date, j]));
  let streak = 0;
  let cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // commence à hier

  while (true) {
    const date = format(cursor, 'yyyy-MM-dd');
    const j = parDate.get(date);
    if (!j || !j.parfaite) break;
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

// Compte les journées parfaites dans la semaine en cours (lundi–dimanche)
export function journeesPalfaitesDesSemaine(journees: Journee[]): number {
  const maintenant = new Date();
  const lundiSemaine = new Date(maintenant);
  const jour = maintenant.getDay() === 0 ? 6 : maintenant.getDay() - 1;
  lundiSemaine.setDate(maintenant.getDate() - jour);
  lundiSemaine.setHours(0, 0, 0, 0);

  return journees.filter((j) => {
    const d = new Date(j.date);
    return d >= lundiSemaine && j.parfaite;
  }).length;
}

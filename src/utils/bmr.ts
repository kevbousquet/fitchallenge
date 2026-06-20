// Calcul du métabolisme de base selon Mifflin-St Jeor
// et proposition de l'objectif calorique pour une perte de poids modérée

export function calculerBMR(
  sexe: 'homme' | 'femme',
  poids: number,   // kg
  taille: number,  // cm
  age: number,
): number {
  if (sexe === 'homme') {
    return Math.round(10 * poids + 6.25 * taille - 5 * age + 5);
  }
  return Math.round(10 * poids + 6.25 * taille - 5 * age - 161);
}

// Facteur d'activité sédentaire (par défaut)
const FACTEUR_SEDENTAIRE = 1.375; // légèrement actif

export function calculerObjectifCalories(
  sexe: 'homme' | 'femme',
  poids: number,
  taille: number,
  age: number,
): number {
  const bmr = calculerBMR(sexe, poids, taille, age);
  // TDEE (dépense journalière totale) - 500 kcal = déficit modéré (~0.5 kg/semaine)
  return Math.round(bmr * FACTEUR_SEDENTAIRE - 500);
}

// Estimation du poids à une date future selon le déficit moyen
export function estimerDateObjectif(
  poidsActuel: number,
  poidsObjectif: number,
  deficitMoyenParJour: number, // kcal
): Date {
  const kgAPerdr = poidsActuel - poidsObjectif;
  // 7700 kcal ≈ 1 kg de graisse
  const joursNecessaires = Math.ceil((kgAPerdr * 7700) / Math.max(deficitMoyenParJour, 100));
  const date = new Date();
  date.setDate(date.getDate() + joursNecessaires);
  return date;
}

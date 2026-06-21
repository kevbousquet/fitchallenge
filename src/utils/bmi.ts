export function calculerIMC(poids: number, tailleCm: number): number {
  if (!poids || !tailleCm) return 0;
  const tailleM = tailleCm / 100;
  return Math.round((poids / (tailleM * tailleM)) * 10) / 10;
}

export interface CategorieIMC {
  label: string;
  color: string;
  bgColor: string;
  min: number;
  max: number;
}

export const CATEGORIES_IMC: CategorieIMC[] = [
  { label: 'Insuffisance pondérale', color: 'text-blue-500',   bgColor: 'bg-blue-50 dark:bg-blue-900/20',   min: 0,    max: 18.4 },
  { label: 'Poids normal',           color: 'text-green-600',  bgColor: 'bg-green-50 dark:bg-green-900/20', min: 18.5, max: 24.9 },
  { label: 'Surpoids',               color: 'text-amber-500',  bgColor: 'bg-amber-50 dark:bg-amber-900/20', min: 25,   max: 29.9 },
  { label: 'Obésité modérée',        color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20', min: 30, max: 34.9 },
  { label: 'Obésité sévère',         color: 'text-red-500',    bgColor: 'bg-red-50 dark:bg-red-900/20',     min: 35,   max: 39.9 },
  { label: 'Obésité morbide',        color: 'text-red-700',    bgColor: 'bg-red-100 dark:bg-red-900/30',    min: 40,   max: 999  },
];

export function getCategorieIMC(imc: number): CategorieIMC {
  return CATEGORIES_IMC.find((c) => imc >= c.min && imc <= c.max) ?? CATEGORIES_IMC[1];
}

export function poidsIdeal(tailleCm: number): { min: number; max: number } {
  const m = tailleCm / 100;
  return {
    min: Math.round(18.5 * m * m * 10) / 10,
    max: Math.round(24.9 * m * m * 10) / 10,
  };
}

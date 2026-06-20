import { db } from './database';
import { format, subDays } from 'date-fns';
import type { User, Repas, Journee, Pesee } from '../types';

export async function seedDemoData() {
  const userCount = await db.users.count();
  if (userCount > 0) return;

  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  const user: User = {
    prenom: 'Alex',
    sexe: 'homme',
    age: 32,
    taille: 178,
    poidsInitial: 88,
    poidsObjectif: 78,
    dateCible: fmt(subDays(today, -120)),
    objectifCalories: 1800,
    objectifPas: 8000,
    objectifVerres: 8,
    challengesActifs: [
      'deficit_calorique', 'pas', 'sport', 'hydratation', 'sommeil', 'pas_de_grignotage',
    ],
    themeSombre: false,
    createdAt: fmt(subDays(today, 14)),
  };

  const userId = await db.users.add(user);

  const repasAujourdhui: Repas[] = [
    {
      userId,
      date: fmt(today),
      nom: "Porridge aux flocons d'avoine",
      calories: 320,
      proteines: 12,
      glucides: 54,
      lipides: 6,
      aliments: [
        { nom: "Flocons d'avoine", portion: '80g', calories: 280, proteines: 10, glucides: 48, lipides: 5 },
        { nom: 'Lait demi-écrémé', portion: '150ml', calories: 40, proteines: 2, glucides: 6, lipides: 1 },
      ],
      createdAt: fmt(today),
    },
    {
      userId,
      date: fmt(today),
      nom: 'Salade de poulet grillé',
      calories: 450,
      proteines: 38,
      glucides: 22,
      lipides: 14,
      aliments: [
        { nom: 'Blanc de poulet', portion: '150g', calories: 250, proteines: 35, glucides: 0, lipides: 3 },
        { nom: 'Salade verte', portion: '100g', calories: 20, proteines: 2, glucides: 3, lipides: 0 },
        { nom: 'Tomates cerises', portion: '80g', calories: 25, proteines: 1, glucides: 5, lipides: 0 },
        { nom: 'Quinoa cuit', portion: '100g', calories: 95, proteines: 4, glucides: 18, lipides: 2 },
      ],
      createdAt: fmt(today),
    },
  ];
  await db.repas.bulkAdd(repasAujourdhui);

  for (let i = 1; i <= 7; i++) {
    const date = fmt(subDays(today, i));
    await db.repas.bulkAdd([
      { userId, date, nom: 'Petit-déjeuner', calories: 350 + Math.floor(Math.random() * 100), proteines: 15, glucides: 50, lipides: 8, createdAt: date },
      { userId, date, nom: 'Déjeuner',       calories: 500 + Math.floor(Math.random() * 150), proteines: 30, glucides: 45, lipides: 18, createdAt: date },
      { userId, date, nom: 'Dîner',          calories: 420 + Math.floor(Math.random() * 100), proteines: 28, glucides: 40, lipides: 12, createdAt: date },
    ]);
  }

  const journeesData: Journee[] = [];
  for (let i = 0; i < 14; i++) {
    const date = fmt(subDays(today, i));
    const sportFait = Math.random() > 0.45;
    const journee: Journee = {
      userId,
      date,
      pas: 5000 + Math.floor(Math.random() * 6000),
      verresBus: 5 + Math.floor(Math.random() * 4),
      sportFait,
      typeSport: sportFait ? (['cardio', 'musculation', 'marche', 'autre'] as const)[Math.floor(Math.random() * 4)] : undefined,
      dureeSport: sportFait ? 30 + Math.floor(Math.random() * 45) : undefined,
      sommeilOk: Math.random() > 0.3,
      pasDeGrignotage: Math.random() > 0.3,
      pasDAlcool: true,
      pasDeSucre: Math.random() > 0.4,
      legumesMange: Math.random() > 0.25,
      parfaite: false,
      updatedAt: date,
    };
    if (i > 0) {
      journee.parfaite = journee.sommeilOk && journee.pasDeGrignotage && journee.sportFait && journee.verresBus >= 8;
    }
    journeesData.push(journee);
  }
  await db.journees.bulkAdd(journeesData);

  const pesees: Pesee[] = [
    { userId, date: fmt(subDays(today, 14)), poids: 88.0 },
    { userId, date: fmt(subDays(today, 11)), poids: 87.5 },
    { userId, date: fmt(subDays(today, 7)),  poids: 86.9 },
    { userId, date: fmt(subDays(today, 3)),  poids: 86.4 },
    { userId, date: fmt(today),              poids: 86.0 },
  ];
  await db.pesees.bulkAdd(pesees);
}

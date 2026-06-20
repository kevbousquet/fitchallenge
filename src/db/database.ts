import Dexie, { type Table } from 'dexie';
import type { User, Repas, Journee, Pesee, BadgeDebloque, FavoriRepas, Mesure } from '../types';

class FitChallengeDB extends Dexie {
  users!: Table<User>;
  repas!: Table<Repas>;
  journees!: Table<Journee>;
  pesees!: Table<Pesee>;
  badges!: Table<BadgeDebloque>;
  favoris!: Table<FavoriRepas>;
  mesures!: Table<Mesure>;

  constructor() {
    super('FitChallengeDB');

    // v1 — schéma initial (mono-profil)
    this.version(1).stores({
      users:    '++id',
      repas:    '++id, date',
      journees: '++id, &date',
      pesees:   '++id, date',
      badges:   '++id, &cle',
    });

    // v2 — multi-profils : ajout de userId sur toutes les tables
    this.version(2).stores({
      users:    '++id',
      repas:    '++id, date, userId',
      journees: '++id, [userId+date], userId',
      pesees:   '++id, date, userId',
      badges:   '++id, [userId+cle], userId',
    }).upgrade(async (tx) => {
      await tx.table('repas').toCollection().modify({ userId: 1 });
      await tx.table('journees').toCollection().modify({ userId: 1 });
      await tx.table('pesees').toCollection().modify({ userId: 1 });
      await tx.table('badges').toCollection().modify({ userId: 1 });
    });

    // v3 — catégories repas, favoris, mesures corporelles
    this.version(3).stores({
      users:    '++id',
      repas:    '++id, date, userId, categorie',
      journees: '++id, [userId+date], userId',
      pesees:   '++id, date, userId',
      badges:   '++id, [userId+cle], userId',
      favoris:  '++id, userId',
      mesures:  '++id, [userId+date], userId',
    });
  }
}

export const db = new FitChallengeDB();

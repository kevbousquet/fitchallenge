import Dexie, { type Table } from 'dexie';
import type { User, Repas, Journee, Pesee, BadgeDebloque } from '../types';

class FitChallengeDB extends Dexie {
  users!: Table<User>;
  repas!: Table<Repas>;
  journees!: Table<Journee>;
  pesees!: Table<Pesee>;
  badges!: Table<BadgeDebloque>;

  constructor() {
    super('FitChallengeDB');
    this.version(1).stores({
      users:    '++id',
      repas:    '++id, date',
      journees: '++id, &date',   // date unique
      pesees:   '++id, date',
      badges:   '++id, &cle',    // une seule entrée par badge
    });
  }
}

export const db = new FitChallengeDB();

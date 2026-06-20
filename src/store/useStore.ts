import { create } from 'zustand';
import { format } from 'date-fns';
import { db } from '../db/database';
import type { User, Journee } from '../types';

interface AppState {
  user: User | null;
  journeeAujourdhui: Journee | null;
  chargement: boolean;

  chargerUser: () => Promise<void>;
  sauvegarderUser: (u: User) => Promise<void>;
  chargerJournee: (date?: string) => Promise<void>;
  mettreAJourJournee: (data: Partial<Journee>) => Promise<void>;
}

const dateAujourdhui = () => format(new Date(), 'yyyy-MM-dd');

export const useStore = create<AppState>((set, get) => ({
  user: null,
  journeeAujourdhui: null,
  chargement: true,

  chargerUser: async () => {
    const user = await db.users.toCollection().first();
    set({ user: user ?? null, chargement: false });
  },

  sauvegarderUser: async (u: User) => {
    if (u.id) {
      await db.users.put(u);
    } else {
      const id = await db.users.add(u);
      u = { ...u, id };
    }
    set({ user: u });
  },

  chargerJournee: async (date?: string) => {
    const d = date ?? dateAujourdhui();
    let journee = await db.journees.where('date').equals(d).first();
    if (!journee) {
      // Crée la journée si elle n'existe pas encore
      const id = await db.journees.add({
        date: d,
        pas: 0,
        verresBus: 0,
        sportFait: false,
        sommeilOk: false,
        pasDeGrignotage: false,
        pasDAlcool: false,
        pasDeSucre: false,
        legumesMange: false,
        parfaite: false,
        updatedAt: d,
      });
      journee = await db.journees.get(id);
    }
    set({ journeeAujourdhui: journee ?? null });
  },

  mettreAJourJournee: async (data: Partial<Journee>) => {
    const { journeeAujourdhui, user } = get();
    if (!journeeAujourdhui?.id) return;

    const updated = { ...journeeAujourdhui, ...data, updatedAt: dateAujourdhui() };

    // Vérifie si la journée est "parfaite" (tous les challenges actifs cochés)
    if (user) {
      const actifs = user.challengesActifs;
      updated.parfaite = actifs.every((id) => {
        switch (id) {
          case 'pas':            return updated.pas >= user.objectifPas;
          case 'sport':          return updated.sportFait;
          case 'hydratation':    return updated.verresBus >= user.objectifVerres;
          case 'sommeil':        return updated.sommeilOk;
          case 'pas_de_grignotage': return updated.pasDeGrignotage;
          case 'pas_alcool':     return updated.pasDAlcool;
          case 'pas_sucre':      return updated.pasDeSucre;
          case 'legumes':        return updated.legumesMange;
          case 'deficit_calorique': return true; // vérifié à part (via calories)
          default: return true;
        }
      });
    }

    await db.journees.update(journeeAujourdhui.id, updated);
    set({ journeeAujourdhui: updated });
  },
}));

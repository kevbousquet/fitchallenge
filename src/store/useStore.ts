import { create } from 'zustand';
import { format } from 'date-fns';
import { db } from '../db/database';
import type { User, Journee } from '../types';

const CLE_PROFIL_ACTIF = 'fitchallenge_userId';

interface AppState {
  user: User | null;
  journeeAujourdhui: Journee | null;
  chargement: boolean;

  chargerUser: () => Promise<void>;
  sauvegarderUser: (u: User) => Promise<void>;
  definirUtilisateurActif: (id: number) => void;
  deconnecterProfil: () => void;
  chargerJournee: (date?: string) => Promise<void>;
  mettreAJourJournee: (data: Partial<Journee>) => Promise<void>;
}

const dateAujourdhui = () => format(new Date(), 'yyyy-MM-dd');

export const useStore = create<AppState>((set, get) => ({
  user: null,
  journeeAujourdhui: null,
  chargement: true,

  chargerUser: async () => {
    const idStr = localStorage.getItem(CLE_PROFIL_ACTIF);
    if (!idStr) {
      set({ user: null, chargement: false });
      return;
    }
    const user = await db.users.get(parseInt(idStr));
    set({ user: user ?? null, chargement: false });
  },

  sauvegarderUser: async (u: User) => {
    if (u.id) {
      await db.users.put(u);
    } else {
      const id = await db.users.add(u);
      u = { ...u, id };
      localStorage.setItem(CLE_PROFIL_ACTIF, String(id));
    }
    set({ user: u });
  },

  definirUtilisateurActif: (id: number) => {
    localStorage.setItem(CLE_PROFIL_ACTIF, String(id));
  },

  deconnecterProfil: () => {
    localStorage.removeItem(CLE_PROFIL_ACTIF);
    set({ user: null, journeeAujourdhui: null });
  },

  chargerJournee: async (date?: string) => {
    const { user } = get();
    if (!user?.id) return;
    const d = date ?? dateAujourdhui();
    let journee = await db.journees.where('[userId+date]').equals([user.id, d]).first();
    if (!journee) {
      const id = await db.journees.add({
        userId: user.id,
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

    if (user) {
      const actifs = user.challengesActifs;
      updated.parfaite = actifs.every((id) => {
        switch (id) {
          case 'pas':               return updated.pas >= user.objectifPas;
          case 'sport':             return updated.sportFait;
          case 'hydratation':       return updated.verresBus >= user.objectifVerres;
          case 'sommeil':           return updated.sommeilOk;
          case 'pas_de_grignotage': return updated.pasDeGrignotage;
          case 'pas_alcool':        return updated.pasDAlcool;
          case 'pas_sucre':         return updated.pasDeSucre;
          case 'legumes':           return updated.legumesMange;
          case 'deficit_calorique': return true;
          default:                  return true;
        }
      });
    }

    await db.journees.update(journeeAujourdhui.id, updated);
    set({ journeeAujourdhui: updated });
  },
}));

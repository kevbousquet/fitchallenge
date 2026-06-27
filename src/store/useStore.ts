import { create } from 'zustand';
import { format } from 'date-fns';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  getProfile, creerProfile, updateProfile,
  getJournee, creerJournee, modifierJournee,
} from '../lib/db';
import type { User, Journee } from '../types';

interface AppState {
  session: Session | null;
  user: User | null;
  journeeAujourdhui: Journee | null;
  chargement: boolean;
  dbVersion: number;

  setSession: (session: Session | null) => void;
  chargerUser: () => Promise<void>;
  sauvegarderUser: (u: User) => Promise<void>;
  deconnecterProfil: () => Promise<void>;
  chargerJournee: (date?: string) => Promise<void>;
  mettreAJourJournee: (data: Partial<Journee>) => Promise<void>;
  refreshDb: () => void;
}

const dateAujourdhui = () => format(new Date(), 'yyyy-MM-dd');

export const useStore = create<AppState>((set, get) => ({
  session: null,
  user: null,
  journeeAujourdhui: null,
  chargement: true,
  dbVersion: 0,

  setSession: (session) => set({ session }),

  chargerUser: async () => {
    const { session } = get();
    if (!session?.user?.id) {
      set({ user: null, chargement: false });
      return;
    }
    const user = await getProfile(session.user.id);
    set({ user, chargement: false });
  },

  sauvegarderUser: async (u: User) => {
    const { session } = get();
    if (!session?.user?.id) return;
    const userId = session.user.id;
    if (u.id) {
      await updateProfile(userId, u);
    } else {
      await creerProfile(userId, u);
      u = { ...u, id: userId };
    }
    set({ user: { ...u, id: userId } });
  },

  deconnecterProfil: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, journeeAujourdhui: null });
  },

  chargerJournee: async (date?: string) => {
    const { user } = get();
    if (!user?.id) return;
    const d = date ?? dateAujourdhui();
    let journee = await getJournee(user.id, d);
    if (!journee) {
      journee = await creerJournee({
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

    await modifierJournee(journeeAujourdhui.id, updated);
    set({ journeeAujourdhui: updated });
  },

  refreshDb: () => set((state) => ({ dbVersion: state.dbVersion + 1 })),
}));

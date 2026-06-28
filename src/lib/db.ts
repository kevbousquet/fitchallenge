import { supabase } from './supabase';
import type { User, Repas, Journee, Pesee, BadgeDebloque, FavoriRepas, Mesure } from '../types';

// ─── Mappers snake_case DB → camelCase TypeScript ────────────────────────────

function mapUser(r: any): User {
  return {
    id: r.id,
    prenom: r.prenom,
    sexe: r.sexe,
    age: r.age,
    taille: r.taille,
    poidsInitial: r.poids_initial,
    poidsObjectif: r.poids_objectif,
    dateCible: r.date_cible,
    objectifCalories: r.objectif_calories,
    objectifPas: r.objectif_pas,
    objectifVerres: r.objectif_verres,
    challengesActifs: r.challenges_actifs ?? [],
    themeSombre: r.theme_sombre,
    createdAt: r.created_at,
    notifRepasActif: r.notif_repas_actif,
    notifRepasHeure: r.notif_repas_heure,
    notifPeseeActif: r.notif_pesee_actif,
    notifPeseeHeure: r.notif_pesee_heure,
  };
}

function mapRepas(r: any): Repas {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    nom: r.nom,
    calories: r.calories,
    proteines: r.proteines ?? undefined,
    glucides: r.glucides ?? undefined,
    lipides: r.lipides ?? undefined,
    photoBase64: r.photo_base64 ?? undefined,
    aliments: r.aliments ?? undefined,
    categorie: r.categorie ?? undefined,
    createdAt: r.created_at,
  };
}

function mapJournee(r: any): Journee {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    pas: r.pas,
    verresBus: r.verres_bus,
    sportFait: r.sport_fait,
    typeSport: r.type_sport ?? undefined,
    dureeSport: r.duree_sport ?? undefined,
    caloriesMontre: r.calories_montre ?? undefined,
    sommeilOk: r.sommeil_ok,
    pasDeGrignotage: r.pas_de_grignotage,
    pasDAlcool: r.pas_d_alcool,
    pasDeSucre: r.pas_de_sucre,
    legumesMange: r.legumes_mange,
    parfaite: r.parfaite,
    updatedAt: r.updated_at,
  };
}

function mapPesee(r: any): Pesee {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    poids: r.poids,
    note: r.note ?? undefined,
  };
}

function mapBadge(r: any): BadgeDebloque {
  return {
    id: r.id,
    userId: r.user_id,
    cle: r.cle,
    debloqueLeDate: r.debloque_le_date,
  };
}

function mapFavori(r: any): FavoriRepas {
  return {
    id: r.id,
    userId: r.user_id,
    nom: r.nom,
    calories: r.calories,
    proteines: r.proteines ?? undefined,
    glucides: r.glucides ?? undefined,
    lipides: r.lipides ?? undefined,
    categorie: r.categorie ?? undefined,
  };
}

function mapMesure(r: any): Mesure {
  return {
    id: r.id,
    userId: r.user_id,
    date: r.date,
    tourDeTaille: r.tour_de_taille ?? undefined,
    hanches: r.hanches ?? undefined,
    poitrine: r.poitrine ?? undefined,
    note: r.note ?? undefined,
  };
}

// ─── Profil / User ───────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<User | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data ? mapUser(data) : null;
}

export async function creerProfile(userId: string, user: Omit<User, 'id'>): Promise<void> {
  await supabase.from('profiles').insert({
    id: userId,
    prenom: user.prenom,
    sexe: user.sexe,
    age: user.age,
    taille: user.taille,
    poids_initial: user.poidsInitial,
    poids_objectif: user.poidsObjectif,
    date_cible: user.dateCible ?? null,
    objectif_calories: user.objectifCalories,
    objectif_pas: user.objectifPas,
    objectif_verres: user.objectifVerres,
    challenges_actifs: user.challengesActifs,
    theme_sombre: user.themeSombre,
    created_at: user.createdAt,
    notif_repas_actif: user.notifRepasActif ?? false,
    notif_repas_heure: user.notifRepasHeure ?? '20:00',
    notif_pesee_actif: user.notifPeseeActif ?? false,
    notif_pesee_heure: user.notifPeseeHeure ?? '08:00',
  });
}

export async function updateProfile(userId: string, user: Partial<User>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (user.prenom !== undefined) update.prenom = user.prenom;
  if (user.sexe !== undefined) update.sexe = user.sexe;
  if (user.age !== undefined) update.age = user.age;
  if (user.taille !== undefined) update.taille = user.taille;
  if (user.poidsInitial !== undefined) update.poids_initial = user.poidsInitial;
  if (user.poidsObjectif !== undefined) update.poids_objectif = user.poidsObjectif;
  if (user.dateCible !== undefined) update.date_cible = user.dateCible;
  if (user.objectifCalories !== undefined) update.objectif_calories = user.objectifCalories;
  if (user.objectifPas !== undefined) update.objectif_pas = user.objectifPas;
  if (user.objectifVerres !== undefined) update.objectif_verres = user.objectifVerres;
  if (user.challengesActifs !== undefined) update.challenges_actifs = user.challengesActifs;
  if (user.themeSombre !== undefined) update.theme_sombre = user.themeSombre;
  if (user.notifRepasActif !== undefined) update.notif_repas_actif = user.notifRepasActif;
  if (user.notifRepasHeure !== undefined) update.notif_repas_heure = user.notifRepasHeure;
  if (user.notifPeseeActif !== undefined) update.notif_pesee_actif = user.notifPeseeActif;
  if (user.notifPeseeHeure !== undefined) update.notif_pesee_heure = user.notifPeseeHeure;
  await supabase.from('profiles').update(update).eq('id', userId);
}

// ─── Repas ────────────────────────────────────────────────────────────────────

export async function getRepasParDate(userId: string, date: string): Promise<Repas[]> {
  const { data } = await supabase
    .from('repas')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  return (data ?? []).map(mapRepas);
}

export async function getTousRepas(userId: string): Promise<Repas[]> {
  const { data } = await supabase.from('repas').select('*').eq('user_id', userId);
  return (data ?? []).map(mapRepas);
}

export async function getRepasRange(userId: string, debut: string, fin: string): Promise<Repas[]> {
  const { data } = await supabase
    .from('repas')
    .select('*')
    .eq('user_id', userId)
    .gte('date', debut)
    .lte('date', fin);
  return (data ?? []).map(mapRepas);
}

export async function getRepasDepuis(userId: string, debut: string): Promise<Repas[]> {
  const { data } = await supabase
    .from('repas')
    .select('*')
    .eq('user_id', userId)
    .gte('date', debut);
  return (data ?? []).map(mapRepas);
}

export async function getNbRepasAvecPhoto(userId: string): Promise<number> {
  const { count } = await supabase
    .from('repas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('photo_base64', 'is', null);
  return count ?? 0;
}

export async function getNbRepasDate(userId: string, date: string): Promise<number> {
  const { count } = await supabase
    .from('repas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', date);
  return count ?? 0;
}

export async function ajouterRepas(repas: Omit<Repas, 'id'>): Promise<Repas> {
  const { data } = await supabase.from('repas').insert({
    user_id: repas.userId,
    date: repas.date,
    nom: repas.nom,
    calories: repas.calories,
    proteines: repas.proteines ?? null,
    glucides: repas.glucides ?? null,
    lipides: repas.lipides ?? null,
    photo_base64: repas.photoBase64 ?? null,
    aliments: repas.aliments ?? null,
    categorie: repas.categorie ?? null,
    created_at: repas.createdAt,
  }).select().single();
  return mapRepas(data);
}

export async function modifierRepas(id: string, repas: Partial<Repas>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (repas.nom !== undefined) update.nom = repas.nom;
  if (repas.calories !== undefined) update.calories = repas.calories;
  if (repas.proteines !== undefined) update.proteines = repas.proteines;
  if (repas.glucides !== undefined) update.glucides = repas.glucides;
  if (repas.lipides !== undefined) update.lipides = repas.lipides;
  if (repas.categorie !== undefined) update.categorie = repas.categorie;
  await supabase.from('repas').update(update).eq('id', id);
}

export async function supprimerRepas(id: string): Promise<void> {
  await supabase.from('repas').delete().eq('id', id);
}

// ─── Journées ────────────────────────────────────────────────────────────────

export async function getJournee(userId: string, date: string): Promise<Journee | null> {
  const { data } = await supabase
    .from('journees')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  return data ? mapJournee(data) : null;
}

export async function getToutesJournees(userId: string): Promise<Journee[]> {
  const { data } = await supabase.from('journees').select('*').eq('user_id', userId);
  return (data ?? []).map(mapJournee);
}

export async function creerJournee(journee: Omit<Journee, 'id'>): Promise<Journee> {
  const { data } = await supabase.from('journees').insert({
    user_id: journee.userId,
    date: journee.date,
    pas: journee.pas,
    verres_bus: journee.verresBus,
    sport_fait: journee.sportFait,
    type_sport: journee.typeSport ?? null,
    duree_sport: journee.dureeSport ?? null,
    sommeil_ok: journee.sommeilOk,
    pas_de_grignotage: journee.pasDeGrignotage,
    pas_d_alcool: journee.pasDAlcool,
    pas_de_sucre: journee.pasDeSucre,
    legumes_mange: journee.legumesMange,
    parfaite: journee.parfaite,
    updated_at: journee.updatedAt,
  }).select().single();
  return mapJournee(data);
}

export async function modifierJournee(id: string, journee: Partial<Journee>): Promise<void> {
  const update: Record<string, unknown> = {};
  if (journee.pas !== undefined) update.pas = journee.pas;
  if (journee.verresBus !== undefined) update.verres_bus = journee.verresBus;
  if (journee.sportFait !== undefined) update.sport_fait = journee.sportFait;
  if (journee.typeSport !== undefined) update.type_sport = journee.typeSport;
  if (journee.dureeSport !== undefined) update.duree_sport = journee.dureeSport;
  if (journee.caloriesMontre !== undefined) update.calories_montre = journee.caloriesMontre;
  if (journee.sommeilOk !== undefined) update.sommeil_ok = journee.sommeilOk;
  if (journee.pasDeGrignotage !== undefined) update.pas_de_grignotage = journee.pasDeGrignotage;
  if (journee.pasDAlcool !== undefined) update.pas_d_alcool = journee.pasDAlcool;
  if (journee.pasDeSucre !== undefined) update.pas_de_sucre = journee.pasDeSucre;
  if (journee.legumesMange !== undefined) update.legumes_mange = journee.legumesMange;
  if (journee.parfaite !== undefined) update.parfaite = journee.parfaite;
  if (journee.updatedAt !== undefined) update.updated_at = journee.updatedAt;
  await supabase.from('journees').update(update).eq('id', id);
}

// ─── Pesées ──────────────────────────────────────────────────────────────────

export async function getPesees(userId: string): Promise<Pesee[]> {
  const { data } = await supabase
    .from('pesees')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  return (data ?? []).map(mapPesee);
}

export async function ajouterPesee(pesee: Omit<Pesee, 'id'>): Promise<void> {
  await supabase.from('pesees').insert({
    user_id: pesee.userId,
    date: pesee.date,
    poids: pesee.poids,
    note: pesee.note ?? null,
  });
}

export async function supprimerPesee(id: string): Promise<void> {
  await supabase.from('pesees').delete().eq('id', id);
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export async function getBadges(userId: string): Promise<BadgeDebloque[]> {
  const { data } = await supabase.from('badges').select('*').eq('user_id', userId);
  return (data ?? []).map(mapBadge);
}

export async function ajouterBadge(badge: Omit<BadgeDebloque, 'id'>): Promise<void> {
  await supabase.from('badges').upsert({
    user_id: badge.userId,
    cle: badge.cle,
    debloque_le_date: badge.debloqueLeDate,
  }, { onConflict: 'user_id,cle', ignoreDuplicates: true });
}

// ─── Favoris ─────────────────────────────────────────────────────────────────

export async function getFavoris(userId: string): Promise<FavoriRepas[]> {
  const { data } = await supabase.from('favoris').select('*').eq('user_id', userId);
  return (data ?? []).map(mapFavori);
}

export async function ajouterFavori(favori: Omit<FavoriRepas, 'id'>): Promise<void> {
  await supabase.from('favoris').insert({
    user_id: favori.userId,
    nom: favori.nom,
    calories: favori.calories,
    proteines: favori.proteines ?? null,
    glucides: favori.glucides ?? null,
    lipides: favori.lipides ?? null,
    categorie: favori.categorie ?? null,
  });
}

export async function supprimerFavori(id: string): Promise<void> {
  await supabase.from('favoris').delete().eq('id', id);
}

// ─── Mesures ─────────────────────────────────────────────────────────────────

export async function getMesures(userId: string): Promise<Mesure[]> {
  const { data } = await supabase
    .from('mesures')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  return (data ?? []).map(mapMesure);
}

export async function ajouterMesure(mesure: Omit<Mesure, 'id'>): Promise<void> {
  await supabase.from('mesures').insert({
    user_id: mesure.userId,
    date: mesure.date,
    tour_de_taille: mesure.tourDeTaille ?? null,
    hanches: mesure.hanches ?? null,
    poitrine: mesure.poitrine ?? null,
    note: mesure.note ?? null,
  });
}

// ─── Export complet ───────────────────────────────────────────────────────────

export async function exporterToutesDonnees(userId: string) {
  const [repas, journees, pesees, badges, favoris, mesures] = await Promise.all([
    getTousRepas(userId),
    getToutesJournees(userId),
    getPesees(userId),
    getBadges(userId),
    getFavoris(userId),
    getMesures(userId),
  ]);
  return { repas, journees, pesees, badges, favoris, mesures };
}

export async function supprimerToutesDonnees(userId: string): Promise<void> {
  await Promise.all([
    supabase.from('repas').delete().eq('user_id', userId),
    supabase.from('journees').delete().eq('user_id', userId),
    supabase.from('pesees').delete().eq('user_id', userId),
    supabase.from('badges').delete().eq('user_id', userId),
    supabase.from('favoris').delete().eq('user_id', userId),
    supabase.from('mesures').delete().eq('user_id', userId),
  ]);
}

-- ═══════════════════════════════════════════════════════════════
-- FitChallenge — Schéma Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Profils utilisateurs (liés à auth.users) ────────────────────
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  prenom          text not null default '',
  sexe            text not null default 'homme',
  age             integer,
  taille          numeric,
  poids_initial   numeric,
  poids_objectif  numeric,
  date_cible      text,
  objectif_calories integer default 1800,
  objectif_pas    integer default 8000,
  objectif_verres integer default 8,
  challenges_actifs text[] default '{}',
  theme_sombre    boolean default false,
  created_at      text not null default '',
  notif_repas_actif  boolean default false,
  notif_repas_heure  text default '20:00',
  notif_pesee_actif  boolean default false,
  notif_pesee_heure  text default '08:00'
);

-- ── Repas ────────────────────────────────────────────────────────
create table if not exists repas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        text not null,
  nom         text not null,
  calories    integer not null,
  proteines   numeric,
  glucides    numeric,
  lipides     numeric,
  photo_base64 text,
  aliments    jsonb,
  categorie   text,
  created_at  text not null
);

-- ── Journées quotidiennes ────────────────────────────────────────
create table if not exists journees (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  date             text not null,
  pas              integer default 0,
  verres_bus       integer default 0,
  sport_fait       boolean default false,
  type_sport       text,
  duree_sport      integer,
  sommeil_ok       boolean default false,
  pas_de_grignotage boolean default false,
  pas_d_alcool     boolean default false,
  pas_de_sucre     boolean default false,
  legumes_mange    boolean default false,
  parfaite         boolean default false,
  updated_at       text not null,
  unique(user_id, date)
);

-- ── Pesées ───────────────────────────────────────────────────────
create table if not exists pesees (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date    text not null,
  poids   numeric not null,
  note    text
);

-- ── Badges débloqués ─────────────────────────────────────────────
create table if not exists badges (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  cle              text not null,
  debloque_le_date text not null,
  unique(user_id, cle)
);

-- ── Repas favoris ────────────────────────────────────────────────
create table if not exists favoris (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  nom       text not null,
  calories  integer not null,
  proteines numeric,
  glucides  numeric,
  lipides   numeric,
  categorie text
);

-- ── Mesures corporelles ──────────────────────────────────────────
create table if not exists mesures (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           text not null,
  tour_de_taille numeric,
  hanches        numeric,
  poitrine       numeric,
  note           text
);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security : chaque utilisateur n'accède qu'à ses données
-- ════════════════════════════════════════════════════════════════

alter table profiles enable row level security;
alter table repas    enable row level security;
alter table journees enable row level security;
alter table pesees   enable row level security;
alter table badges   enable row level security;
alter table favoris  enable row level security;
alter table mesures  enable row level security;

create policy "Profil perso" on profiles for all using (auth.uid() = id);
create policy "Repas perso"  on repas    for all using (auth.uid() = user_id);
create policy "Journees perso" on journees for all using (auth.uid() = user_id);
create policy "Pesees perso" on pesees   for all using (auth.uid() = user_id);
create policy "Badges perso" on badges   for all using (auth.uid() = user_id);
create policy "Favoris perso" on favoris for all using (auth.uid() = user_id);
create policy "Mesures perso" on mesures for all using (auth.uid() = user_id);

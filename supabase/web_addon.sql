-- Futbol Unite WEB eklentisi
-- Kart Düellosu oyun tablolarına DOKUNMAZ.
-- Supabase SQL Editor'de bir kez çalıştırın.

create table if not exists public.fu_web_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  favorite_team_id text not null default 'general',
  avatar_emoji text not null default '⚽',
  updated_at timestamptz not null default now()
);

create table if not exists public.fu_web_reviews (
  id text primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  match_id text,
  player_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists fu_web_reviews_match_idx on public.fu_web_reviews (match_id);
create index if not exists fu_web_reviews_user_idx on public.fu_web_reviews (user_id);

create table if not exists public.fu_web_matches (
  id text primary key,
  season integer not null,
  week integer not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.fu_web_standings (
  id text primary key,
  season integer not null,
  week integer,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.fu_web_prefs enable row level security;
alter table public.fu_web_reviews enable row level security;
alter table public.fu_web_matches enable row level security;
alter table public.fu_web_standings enable row level security;

drop policy if exists "fu_web_prefs_own" on public.fu_web_prefs;
create policy "fu_web_prefs_own" on public.fu_web_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "fu_web_reviews_read" on public.fu_web_reviews;
create policy "fu_web_reviews_read" on public.fu_web_reviews for select using (true);

drop policy if exists "fu_web_reviews_write_own" on public.fu_web_reviews;
create policy "fu_web_reviews_write_own" on public.fu_web_reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "fu_web_reviews_update_own" on public.fu_web_reviews;
create policy "fu_web_reviews_update_own" on public.fu_web_reviews
  for update using (auth.uid() = user_id);

drop policy if exists "fu_web_matches_read" on public.fu_web_matches;
create policy "fu_web_matches_read" on public.fu_web_matches for select using (true);

drop policy if exists "fu_web_standings_read" on public.fu_web_standings;
create policy "fu_web_standings_read" on public.fu_web_standings for select using (true);

-- Kayıtlı kullanıcı sayısı (satır döndürmez, sadece adet)
create or replace function public.fu_web_registered_user_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.profiles
  where auth_provider is not null
    and lower(auth_provider) not in ('misafir', 'guest', 'anonymous');
$$;

revoke all on function public.fu_web_registered_user_count() from public;
grant execute on function public.fu_web_registered_user_count() to anon, authenticated;

-- Kayıt formunda mevcut e-postayı yakala (kod ekranına düşmesin)
create or replace function public.fu_web_email_is_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.fu_web_email_is_registered(text) from public;
grant execute on function public.fu_web_email_is_registered(text) to anon, authenticated;

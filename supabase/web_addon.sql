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

drop policy if exists "fu_web_reviews_delete_own" on public.fu_web_reviews;
create policy "fu_web_reviews_delete_own" on public.fu_web_reviews
  for delete using (auth.uid() = user_id);

drop policy if exists "fu_web_matches_read" on public.fu_web_matches;
create policy "fu_web_matches_read" on public.fu_web_matches for select using (true);

drop policy if exists "fu_web_standings_read" on public.fu_web_standings;
create policy "fu_web_standings_read" on public.fu_web_standings for select using (true);

-- Web kaydı profiles satırı yoksa yorum FK patlamasın
create or replace function public.fu_web_ensure_profile(p_display_name text default null, p_avatar text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.profiles (id, display_name, avatar_url, auth_provider)
  values (
    auth.uid(),
    nullif(trim(coalesce(p_display_name, '')), ''),
    nullif(trim(coalesce(p_avatar, '')), ''),
    'Web'
  )
  on conflict (id) do update
  set auth_provider = case
    when profiles.auth_provider is null
      or lower(profiles.auth_provider) in ('', 'misafir', 'guest', 'anonymous')
    then 'Web'
    else profiles.auth_provider
  end;
exception
  when others then
    update public.profiles
    set auth_provider = coalesce(nullif(auth_provider, ''), 'Web')
    where id = auth.uid()
      and (auth_provider is null or lower(auth_provider) in ('misafir', 'guest', 'anonymous', ''));
end;
$$;

revoke all on function public.fu_web_ensure_profile(text, text) from public;
grant execute on function public.fu_web_ensure_profile(text, text) to authenticated;

-- Kayıtlı kullanıcı sayısı (auth.users: web + oyun üyeleri)
create or replace function public.fu_web_registered_user_count()
returns integer
language sql
stable
security definer
set search_path = auth, public
as $$
  select count(*)::integer
  from auth.users
  where nullif(trim(email), '') is not null
    and coalesce(raw_user_meta_data->>'auth_provider', '') not in ('misafir', 'guest', 'anonymous');
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

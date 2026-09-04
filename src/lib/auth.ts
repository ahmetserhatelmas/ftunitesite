import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { SUPER_LIG_TEAMS_MAP } from '../data/superLigClubs2026';
import { censorProfanity } from './censor';
import { getBrowserSupabase, isBrowserSupabaseConfigured } from './supabase';

export interface AuthResult {
  ok: boolean;
  error?: string;
  needsEmailConfirm?: boolean;
  profile?: UserProfile;
}

export interface GameProfileRow {
  id: string;
  display_name?: string | null;
  team_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  level?: number | null;
}

export function retryAfterSeconds(message: string): number {
  const m = message.match(/(\d+)\s*(saniye|seconds?)/i);
  return m ? Number(m[1]) : 0;
}

export function isValidEmailOtp(token: string): boolean {
  return /^\d{6}$/.test(token.replace(/\D/g, ''));
}

function friendlyAuthError(message?: string): string {
  const raw = (message || '').toLowerCase();
  if (raw.includes('invalid login') || raw.includes('invalid credentials')) {
    return 'E-posta veya şifre hatalı. Kart Düellosu hesabınla aynı bilgileri kullan.';
  }
  if (raw.includes('already registered') || raw.includes('already been registered') || raw.includes('user already exists')) {
    return 'Bu e-posta zaten kayıtlı. Giriş yap veya şifremi unuttum kullan.';
  }
  if (raw.includes('email not confirmed')) {
    return 'E-posta doğrulanmadı. Mailindeki 6 haneli kodu gir.';
  }
  if (raw.includes('security purposes') || raw.includes('you can only request this after')) {
    const wait = retryAfterSeconds(message || '');
    return wait > 0
      ? `Güvenlik için ${wait} saniye bekle, sonra tekrar kod iste.`
      : 'Güvenlik için biraz bekleyip tekrar kod iste.';
  }
  if (raw.includes('rate limit') || raw.includes('over_email_send_rate_limit') || raw.includes('429') || raw.includes('too many')) {
    return 'Çok fazla kod istendi. 1 dakika sonra tekrar dene.';
  }
  if (raw.includes('otp') || raw.includes('token') || raw.includes('expired') || raw.includes('invalid')) {
    return 'Kod hatalı veya süresi doldu. Yeni kod iste.';
  }
  if (raw.includes('same password') || raw.includes('should be different')) {
    return 'Yeni şifre eskisinden farklı olmalı.';
  }
  if (raw.includes('password')) {
    return 'Şifre en az 6 karakter olmalı.';
  }
  return message || 'İşlem başarısız. Tekrar dene.';
}

export function hasChosenFavoriteClub(profile?: { favoriteTeamId?: string | null } | null): boolean {
  const id = profile?.favoriteTeamId;
  return Boolean(id && id !== 'general' && SUPER_LIG_TEAMS_MAP[id]);
}

function clubFromId(teamId?: string | null) {
  if (teamId && SUPER_LIG_TEAMS_MAP[teamId]) return { id: teamId, ...SUPER_LIG_TEAMS_MAP[teamId] };
  return { id: 'general', name: 'Süper Lig', badge: '⚽' };
}

function pickAvatar(emoji?: string | null, avatarUrl?: string | null): string {
  if (emoji && emoji.length <= 4 && !emoji.startsWith('http')) return emoji;
  if (avatarUrl && !avatarUrl.startsWith('http') && avatarUrl.length <= 4) return avatarUrl;
  return '⚽';
}

export function mapSharedProfile(
  user: User,
  game?: GameProfileRow | null,
  prefs?: { favorite_team_id?: string; avatar_emoji?: string } | null,
): UserProfile {
  const meta = user.user_metadata || {};
  const nickname = censorProfanity(game?.display_name || meta.display_name || user.email?.split('@')[0] || 'Taraftar');
  // Kart Düellosu `team_name` özel takım adıdır; Süper Lig kulübü sayılmaz.
  const teamId = prefs?.favorite_team_id || meta.favorite_team_id || 'general';
  const club = clubFromId(teamId);
  const created = game?.created_at || user.created_at;
  const memberSince = created
    ? new Date(created).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : 'Futbol Unite';

  return {
    id: user.id,
    name: nickname,
    username: nickname.toLowerCase().replace(/[^a-z0-9_]/gi, '_'),
    nickname,
    email: user.email || '',
    avatar: pickAvatar(prefs?.avatar_emoji || meta.avatar_emoji, game?.avatar_url),
    bio: typeof meta.bio === 'string' ? censorProfanity(meta.bio) : '',
    favoriteTeamId: club.id,
    favoriteTeamName: club.name,
    favoriteTeamBadge: club.badge,
    city: typeof meta.city === 'string' ? meta.city : '',
    memberSince,
    title: typeof meta.title === 'string' && meta.title ? meta.title : 'Futbol Unite Üyesi',
    isRegistered: true,
  };
}

export async function loadSharedProfile(user: User): Promise<UserProfile> {
  const sb = getBrowserSupabase();
  if (!sb) return mapSharedProfile(user);

  const [profileRes, prefsRes] = await Promise.all([
    sb.from('profiles').select('id, display_name, team_name, avatar_url, created_at, level').eq('id', user.id).maybeSingle(),
    sb.from('fu_web_prefs').select('favorite_team_id, avatar_emoji').eq('user_id', user.id).maybeSingle(),
  ]);

  return mapSharedProfile(user, profileRes.data, prefsRes.data);
}

async function persistWebPrefs(userId: string, favoriteTeamId: string, avatarEmoji: string): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb) return;

  await sb.auth.updateUser({
    data: {
      favorite_team_id: favoriteTeamId,
      avatar_emoji: avatarEmoji,
    },
  });

  const { error } = await sb.from('fu_web_prefs').upsert(
    {
      user_id: userId,
      favorite_team_id: favoriteTeamId,
      avatar_emoji: avatarEmoji,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    console.info('fu_web_prefs henüz yok veya yazılamadı; tercih user metadata içinde tutuluyor.');
  }
}

async function fillEmptyGameDisplayName(userId: string, nickname: string, avatar: string): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb) return;

  const { data } = await sb.from('profiles').select('display_name, avatar_url').eq('id', userId).maybeSingle();
  const patch: Record<string, string> = {};
  if (data && !data.display_name) patch.display_name = nickname;
  if (data && !data.avatar_url && avatar) patch.avatar_url = avatar;
  if (Object.keys(patch).length === 0) return;

  const { error } = await sb.from('profiles').update(patch).eq('id', userId);
  if (error) console.warn('Profil adı güncellenemedi:', error.message);
}

export async function signUpSharedAccount(input: {
  nickname: string;
  email: string;
  password: string;
  favoriteTeamId: string;
  avatar: string;
}): Promise<AuthResult> {
  const sb = getBrowserSupabase();
  if (!sb || !isBrowserSupabaseConfigured()) {
    return { ok: false, error: 'Supabase yapılandırılmadı.' };
  }

  const { data, error } = await sb.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        display_name: input.nickname,
        favorite_team_id: input.favoriteTeamId,
        avatar_emoji: input.avatar,
        auth_provider: 'Web',
      },
    },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };

  if (!data.session || !data.user) {
    return {
      ok: true,
      needsEmailConfirm: true,
    };
  }

  await persistWebPrefs(data.user.id, input.favoriteTeamId, input.avatar);
  await fillEmptyGameDisplayName(data.user.id, input.nickname, input.avatar);
  const profile = await loadSharedProfile(data.user);
  return { ok: true, profile };
}

export async function sendRegistrationOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getBrowserSupabase();
  if (!sb || !isBrowserSupabaseConfigured()) {
    return { ok: false, error: 'Supabase yapılandırılmadı.' };
  }
  const trimmed = email.trim().toLowerCase();
  const { error } = await sb.auth.signInWithOtp({
    email: trimmed,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

export async function sendPasswordResetOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getBrowserSupabase();
  if (!sb || !isBrowserSupabaseConfigured()) {
    return { ok: false, error: 'Supabase yapılandırılmadı.' };
  }
  const trimmed = email.trim().toLowerCase();
  const { error } = await sb.auth.resetPasswordForEmail(trimmed);
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

async function verifyEmailOtp(
  email: string,
  token: string,
  type: 'email' | 'recovery' | 'signup',
): Promise<{ user: User | null; error?: string }> {
  const sb = getBrowserSupabase();
  if (!sb || !isBrowserSupabaseConfigured()) {
    return { user: null, error: 'Supabase yapılandırılmadı.' };
  }
  const code = token.replace(/\s/g, '');
  if (!isValidEmailOtp(code)) {
    return { user: null, error: 'Maildeki 6 haneli kodu gir.' };
  }
  const { data, error } = await sb.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code,
    type,
  });
  if (error) return { user: null, error: friendlyAuthError(error.message) };
  return { user: data.user ?? data.session?.user ?? null };
}

async function setAccountPassword(password: string): Promise<{ ok: boolean; error?: string; samePassword?: boolean }> {
  const sb = getBrowserSupabase();
  if (!sb) return { ok: false, error: 'Supabase yapılandırılmadı.' };
  const { error } = await sb.auth.updateUser({ password: password.trim() });
  if (error) {
    const raw = error.message.toLowerCase();
    return {
      ok: false,
      error: friendlyAuthError(error.message),
      samePassword: raw.includes('should be different') || raw.includes('same password'),
    };
  }
  return { ok: true };
}

export async function completeSignupWithOtp(input: {
  email: string;
  token: string;
  nickname: string;
  password: string;
  favoriteTeamId: string;
  avatar: string;
}): Promise<AuthResult> {
  const verified = await verifyEmailOtp(input.email, input.token, 'email');
  if (!verified.user) {
    const signupTry = await verifyEmailOtp(input.email, input.token, 'signup');
    if (!signupTry.user) return { ok: false, error: verified.error || signupTry.error || 'Kod doğrulanamadı.' };
    verified.user = signupTry.user;
  }

  const pw = await setAccountPassword(input.password);
  if (!pw.ok) return { ok: false, error: pw.error || 'Şifre kaydedilemedi.' };

  const sb = getBrowserSupabase();
  if (sb) {
    await sb.auth.updateUser({
      data: {
        display_name: input.nickname,
        favorite_team_id: input.favoriteTeamId,
        avatar_emoji: input.avatar,
        auth_provider: 'Web',
      },
    });
  }

  await persistWebPrefs(verified.user.id, input.favoriteTeamId, input.avatar);
  await fillEmptyGameDisplayName(verified.user.id, input.nickname, input.avatar);
  const profile = await loadSharedProfile(verified.user);
  return { ok: true, profile };
}

export async function completePasswordResetWithOtp(input: {
  email: string;
  token: string;
  password: string;
}): Promise<AuthResult> {
  const verified = await verifyEmailOtp(input.email, input.token, 'recovery');
  if (!verified.user) return { ok: false, error: verified.error || 'Kod doğrulanamadı.' };

  const pw = await setAccountPassword(input.password);
  if (!pw.ok && !pw.samePassword) return { ok: false, error: pw.error || 'Şifre güncellenemedi.' };

  const profile = await loadSharedProfile(verified.user);
  return { ok: true, profile };
}

export async function signInSharedAccount(email: string, password: string): Promise<AuthResult> {
  const sb = getBrowserSupabase();
  if (!sb || !isBrowserSupabaseConfigured()) {
    return { ok: false, error: 'Supabase yapılandırılmadı.' };
  }

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  if (!data.user) return { ok: false, error: 'Oturum açılamadı.' };

  const profile = await loadSharedProfile(data.user);
  return { ok: true, profile };
}

export async function signOutSharedAccount(): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function syncSharedProfilePatch(updates: Partial<UserProfile>): Promise<void> {
  const sb = getBrowserSupabase();
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return;

  const nextMeta: Record<string, string> = {};
  if (typeof updates.bio === 'string') nextMeta.bio = updates.bio;
  if (typeof updates.city === 'string') nextMeta.city = updates.city;
  if (typeof updates.title === 'string') nextMeta.title = updates.title;
  if (Object.keys(nextMeta).length > 0) {
    await sb.auth.updateUser({ data: nextMeta });
  }

  if (updates.favoriteTeamId || updates.avatar) {
    await persistWebPrefs(user.id, updates.favoriteTeamId || 'general', updates.avatar || '⚽');
  }

  if (updates.nickname || updates.name) {
    await fillEmptyGameDisplayName(user.id, updates.nickname || updates.name || '', updates.avatar || '');
    const { data: existing } = await sb.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
    if (existing?.display_name) {
      await sb.from('profiles').update({ display_name: updates.nickname || updates.name }).eq('id', user.id);
    }
  }
}

export async function getCurrentSharedUser() {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user ?? null;
}

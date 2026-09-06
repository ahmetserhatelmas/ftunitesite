import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Match, Player, PlayerReview, ReviewReply, League, UserProfile, Manager, ManagerRankingItem, Team, FollowedCommentator, UserLevelInfo } from '../types';
import { INITIAL_MATCHES, LEAGUES } from '../data/mockData';
import { SUPER_LIG_TEAMS_MAP } from '../data/superLigClubs2026';
import { StandingTeam } from '../data/superLigStandings';
import { getBrowserSupabase } from '../lib/supabase';
import {
  completePasswordResetWithOtp,
  completeSignupWithOtp,
  hasChosenFavoriteClub,
  loadSharedProfile,
  sendPasswordResetOtp,
  sendRegistrationOtp,
  signInSharedAccount,
  signOutSharedAccount,
  signUpSharedAccount,
  syncSharedProfilePatch,
} from '../lib/auth';
import { deleteWebReview, ensureWebProfile, loadWebReviews, saveWebReview } from '../lib/webReviews';
import { isOwnReview, replaceReviewsFromCloud, stampReviewOwnership } from '../lib/reviews';
import { fetchRegisteredUserCount } from '../lib/userCount';
import { deriveActiveWeek, isMatchLive, matchHasStarted, matchNeedsLineupRefresh, matchNeedsScoreRefresh, normalizePersonName } from '../lib/matchTime';
import { censorProfanity, sanitizeReply, sanitizeReview } from '../lib/censor';
import confetti from 'canvas-confetti';

export const LEVEL_TIERS = [
  { level: 1, minXp: 0, title: 'Çaylak Yorumcu', emoji: '🥉', color: 'from-amber-700 to-amber-900', border: 'border-amber-700/50', bg: 'bg-amber-950/40' },
  { level: 2, minXp: 150, title: 'Tribün Müdavimi', emoji: '🥈', color: 'from-slate-400 to-slate-600', border: 'border-slate-400/50', bg: 'bg-slate-800/40' },
  { level: 3, minXp: 400, title: 'Taktik Meraklısı', emoji: '🥇', color: 'from-amber-400 to-amber-600', border: 'border-amber-400/50', bg: 'bg-amber-900/30' },
  { level: 4, minXp: 800, title: 'Usta Yorumcu', emoji: '⭐', color: 'from-emerald-500 to-teal-700', border: 'border-emerald-500/50', bg: 'bg-emerald-950/40' },
  { level: 5, minXp: 1400, title: 'Futbol Otoritesi', emoji: '💎', color: 'from-cyan-500 to-blue-700', border: 'border-cyan-500/50', bg: 'bg-cyan-950/40' },
  { level: 6, minXp: 2200, title: 'Baş Analist', emoji: '👑', color: 'from-purple-500 to-indigo-700', border: 'border-purple-500/50', bg: 'bg-purple-950/40' },
  { level: 7, minXp: 3500, title: 'Efsane Tribün Lideri', emoji: '🏆', color: 'from-amber-300 via-yellow-400 to-amber-600', border: 'border-yellow-400', bg: 'bg-yellow-950/50' },
];

interface AppContextType {
  leagues: League[];
  selectedLeagueId: string;
  setSelectedLeagueId: (id: string) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  currentWeek: number;
  isPastWeek: (week: number) => boolean;
  canWriteMatchReview: (match?: Match | null) => boolean;
  matchWriteLock: (match?: Match | null) => 'none' | 'unplayed';
  canRateTeam: (teamId?: string | null) => boolean;
  matches: Match[];
  standings: StandingTeam[];
  standingsMeta: { seasonLabel: string; week: number; updatedAt: string };
  selectedMatchId: string | null;
  setSelectedMatchId: (id: string | null) => void;
  selectedMatch: Match | null;
  selectedPlayer: Player | null;
  setSelectedPlayer: (player: Player | null) => void;
  selectedManager: Manager | null;
  setSelectedManager: (manager: Manager | null) => void;
  activeView: 'pitch' | 'list' | 'totw' | 'ranking' | 'all-reviews' | 'my-reviews' | 'player-history' | 'managers';
  setActiveView: (view: 'pitch' | 'list' | 'totw' | 'ranking' | 'all-reviews' | 'my-reviews' | 'player-history' | 'managers') => void;
  teamTab: 'all' | 'home' | 'away';
  setTeamTab: (tab: 'all' | 'home' | 'away') => void;
  positionFilter: string;
  setPositionFilter: (pos: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  reviews: PlayerReview[];
  addReview: (review: Omit<PlayerReview, 'id' | 'createdAt' | 'likes' | 'likedByMe' | 'isUserSubmission'>) => void;
  deleteReview: (reviewId: string) => void;
  toggleLikeReview: (reviewId: string) => void;
  toggleDislikeReview: (reviewId: string) => void;
  reportSpamReview: (reviewId: string, reason: string, note?: string) => void;
  cancelSpamReport: (reviewId: string) => void;
  spamReportingReview: PlayerReview | null;
  setSpamReportingReview: (review: PlayerReview | null) => void;
  addReviewReply: (reviewId: string, replyComment: string, authorInfo?: { name?: string; fanOf?: string; avatar?: string }) => void;
  deleteReviewReply: (reviewId: string, replyId: string) => void;
  toggleLikeReply: (reviewId: string, replyId: string) => void;
  toggleDislikeReply: (reviewId: string, replyId: string) => void;
  reportSpamReply: (reviewId: string, replyId: string, reason: string) => void;
  cancelSpamReplyReport: (reviewId: string, replyId: string) => void;
  voteMotm: (matchId: string, playerId: string) => void;
  userMotmVoteCount: number;
  getPlayerReviews: (playerId: string, matchId: string) => PlayerReview[];
  getPlayerAverageRating: (playerId: string, matchId?: string) => { rating: number; count: number };
  getPlayerCommentCount: (playerId: string, matchId?: string) => number;
  getManagerReviews: (managerId: string, matchId?: string) => PlayerReview[];
  getManagerAverageRating: (managerId: string, matchId?: string) => { rating: number; count: number };
  getManagerCommentCount: (managerId: string, matchId?: string) => number;
  getAllManagersRanking: (week?: number) => ManagerRankingItem[];
  getTotw: (leagueId: string, week: number) => { xi: Player[]; mvp: Player | null };
  getUserReviews: () => PlayerReview[];
  getMyReviewsRepliesCount: () => number;
  myReviewsRepliesCount: number;
  markAllRepliesAsRead: () => void;
  markReviewRepliesAsRead: (reviewId: string) => void;
  simulateIncomingReply: (targetReviewId?: string) => void;
  addNewMatch: (match: Match) => void;
  openPlayerModal: (player: Player, matchId?: string) => void;
  openManagerModal: (manager: Manager, matchId?: string) => void;
  isMyReviewsOpen: boolean;
  setIsMyReviewsOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  userProfile: UserProfile;
  isRegistered: boolean;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  registerUser: (data: { nickname: string; email: string; password: string; favoriteTeamId?: string; avatar?: string }) => Promise<{ ok: boolean; error?: string; needsEmailConfirm?: boolean }>;
  loginUser: (email: string, password: string) => Promise<{ ok: boolean; error?: string; needsFavoriteClub?: boolean; needsEmailConfirm?: boolean }>;
  sendSignupCode: (email: string) => Promise<{ ok: boolean; error?: string; alreadyRegistered?: boolean }>;
  finishSignupWithCode: (data: { email: string; token: string; nickname: string; password: string; favoriteTeamId: string; avatar: string }) => Promise<{ ok: boolean; error?: string; needsFavoriteClub?: boolean }>;
  sendResetCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  finishResetWithCode: (data: { email: string; token: string; password: string }) => Promise<{ ok: boolean; error?: string; needsFavoriteClub?: boolean }>;
  completeFavoriteClub: (teamId: string) => { ok: boolean; error?: string };
  logoutUser: () => void;
  requireAuth: (callback?: () => void) => boolean;
  needsFavoriteClub: boolean;
  isQuickRegisterOpen: boolean;
  setIsQuickRegisterOpen: (open: boolean) => void;
  pendingAuthAction: (() => void) | null;
  setPendingAuthAction: (action: (() => void) | null) => void;
  isLiveSyncing: boolean;
  lastLiveSyncTime: string;
  liveDataSource: string;
  registeredUserCount: number | null;
  syncLiveMatches: (weekNumber?: number) => Promise<void>;
  refreshLiveData: () => Promise<void>;
  isOwnReview: (review?: PlayerReview | null) => boolean;

  // Follower & Level System
  followedCommentators: FollowedCommentator[];
  toggleFollowUser: (authorName: string, authorData?: { avatar?: string; fanOf?: string; teamId?: string }) => boolean;
  isFollowingUser: (authorName: string) => boolean;
  unfollowUser: (authorName: string) => void;
  followersCount: number;
  followingCount: number;
  userLevelInfo: UserLevelInfo;
  getAuthorLevel: (authorName: string, likesHint?: number) => { level: number; title: string; badgeEmoji: string; color: string; border: string; bg: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_REVIEWS_KEY = 'tribun_notu_sl_reviews_live_v1';
const LOCAL_STORAGE_MOTM_VOTES = 'tribun_notu_sl_motm_live_v1';
const LOCAL_STORAGE_PROFILE_KEY = 'futbol_unite_user_profile_2026_v2';
const LOCAL_STORAGE_READ_REPLIES_KEY = 'tribun_notu_read_replies_v1';
const LOCAL_STORAGE_FOLLOWING_KEY = 'tribun_notu_followed_commentators_v3';

const DEMO_FOLLOW_NAMES = new Set([
  'kadıköyboğası',
  'taktiküstadı',
  'taktikustadı',
  'kartalyuvası',
  'kartalyuvasi',
]);

function isDemoFollowName(name?: string): boolean {
  if (!name) return false;
  return DEMO_FOLLOW_NAMES.has(name.trim().toLocaleLowerCase('tr-TR'));
}

function countStoredMotmVotes(): number {
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${LOCAL_STORAGE_MOTM_VOTES}_`)) count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}

// Automatic legacy cleanup to ensure a pristine blank state for the first user
try {
  const legacyKeys = [
    'tribun_notu_sl_reviews_2026_08_27_v1',
    'tribun_notu_sl_matches_2026_08_27_v1',
    'tribun_notu_sl_motm_2026_08_27_v1',
    'tribun_notu_sl_reviews_v1',
    'tribun_notu_sl_matches_v1',
    'tribun_notu_followed_commentators_v1',
    'tribun_notu_followed_commentators_v2',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch {
  // Ignore
}

const SUPER_LIG_TEAMS_LOOKUP: Record<string, { name: string; badge: string }> = {
  ...SUPER_LIG_TEAMS_MAP,
  general: { name: 'Süper Lig', badge: '⚽' },
};

const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'guest-user',
  name: 'Misafir Kullanıcı',
  username: 'misafir_kullanici',
  nickname: 'Misafir',
  email: '',
  avatar: '👤',
  bio: 'Süper Lig maçlarını ve oyuncu puanlamalarını takip ediyor.',
  favoriteTeamId: 'general',
  favoriteTeamName: 'Süper Lig',
  favoriteTeamBadge: '⚽',
  city: 'Türkiye',
  memberSince: 'Misafir Girişi',
  title: 'Gözlemci',
  isRegistered: false,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leagues, setLeagues] = useState<League[]>(LEAGUES);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('super-lig');
  const [selectedWeek, setSelectedWeekState] = useState<number>(() => {
    const stored = Number(sessionStorage.getItem('fu_selected_week'));
    return Number.isFinite(stored) && stored >= 1 ? stored : 1;
  });
  const userPickedWeek = useRef(Boolean(sessionStorage.getItem('fu_selected_week')));
  const setSelectedWeek = (week: number) => {
    userPickedWeek.current = true;
    setSelectedWeekState(week);
  };
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [standingsMeta, setStandingsMeta] = useState({ seasonLabel: '2026/27', week: 1, updatedAt: '' });
  const hydratedWeeks = useRef<Set<number>>(new Set());
  const lastReviewSubmit = useRef<{ key: string; at: number } | null>(null);

  const currentLeague = leagues.find((l) => l.id === selectedLeagueId) || leagues[0];
  const currentWeek = currentLeague?.currentWeek || 1;
  const isPastWeek = (weekNumber: number) => weekNumber < currentWeek;
  const canWriteMatchReview = (match?: Match | null) => {
    if (!match) return false;
    return matchHasStarted(match);
  };
  const matchWriteLock = (match?: Match | null): 'none' | 'unplayed' => {
    return canWriteMatchReview(match) ? 'none' : 'unplayed';
  };
  const canRateTeam = (teamId?: string | null) => {
    if (!userProfile.favoriteTeamId || userProfile.favoriteTeamId === 'general') return true;
    return Boolean(teamId && teamId === userProfile.favoriteTeamId);
  };
  
  const [matches, setMatches] = useState<Match[]>([]);
  const matchesRef = useRef<Match[]>([]);
  matchesRef.current = matches;

  const [reviews, setReviews] = useState<PlayerReview[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((r: PlayerReview) => r.isUserSubmission).map(sanitizeReview);
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => sessionStorage.getItem('fu_selected_match'));
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [activeView, setActiveView] = useState<'pitch' | 'list' | 'totw' | 'ranking' | 'all-reviews' | 'my-reviews' | 'player-history' | 'managers'>(() => {
    const stored = sessionStorage.getItem('fu_active_view');
    const allowed = ['pitch', 'list', 'totw', 'ranking', 'all-reviews', 'my-reviews', 'player-history', 'managers'] as const;
    return allowed.includes(stored as (typeof allowed)[number]) ? (stored as (typeof allowed)[number]) : 'pitch';
  });
  const [teamTab, setTeamTab] = useState<'all' | 'home' | 'away'>('home');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMyReviewsOpen, setIsMyReviewsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState<boolean>(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);
  const [spamReportingReview, setSpamReportingReview] = useState<PlayerReview | null>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<string>('Canlı akış aktif');
  const [liveDataSource, setLiveDataSource] = useState<string>('Trendyol Süper Lig Canlı Fikstür & Kadro Merkezi');
  const [registeredUserCount, setRegisteredUserCount] = useState<number | null>(null);

  const [readReplyIds, setReadReplyIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_READ_REPLIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [followedCommentators, setFollowedCommentators] = useState<FollowedCommentator[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FOLLOWING_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((f: FollowedCommentator) => !isDemoFollowName(f?.name));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [userMotmVoteCount, setUserMotmVoteCount] = useState(() => countStoredMotmVotes());

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FOLLOWING_KEY, JSON.stringify(followedCommentators));
    } catch (e) {
      console.error(e);
    }
  }, [followedCommentators]);

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_GUEST_PROFILE);
  const clubPromptedFor = useRef<string | null>(null);

  const isRegistered = !!userProfile.isRegistered;
  const needsFavoriteClub = isRegistered && !hasChosenFavoriteClub(userProfile);

  const requireAuth = (callback?: () => void): boolean => {
    if (userProfile.isRegistered && hasChosenFavoriteClub(userProfile)) {
      if (callback) callback();
      return true;
    }
    if (callback) {
      setPendingAuthAction(() => callback);
    }
    setIsQuickRegisterOpen(true);
    return false;
  };

  const persistLocalProfile = (profile: UserProfile) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const celebrateAndResume = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    if (pendingAuthAction) {
      const action = pendingAuthAction;
      setPendingAuthAction(null);
      setTimeout(() => action(), 250);
    }
  };

  const applySignedInProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    persistLocalProfile(profile);
    if (hasChosenFavoriteClub(profile)) {
      celebrateAndResume();
    }
  };

  const registerUser = async (data: { nickname: string; email: string; password: string; favoriteTeamId?: string; avatar?: string }) => {
    const result = await signUpSharedAccount({
      nickname: data.nickname,
      email: data.email,
      password: data.password,
      favoriteTeamId: data.favoriteTeamId || 'general',
      avatar: data.avatar || '⚽',
    });
    if (result.ok && result.profile) {
      applySignedInProfile(result.profile);
    }
    return result;
  };

  const loginUser = async (email: string, password: string) => {
    const result = await signInSharedAccount(email, password);
    if (result.ok && result.profile) {
      applySignedInProfile(result.profile);
      return {
        ok: true,
        needsFavoriteClub: !hasChosenFavoriteClub(result.profile),
      };
    }
    const needsEmailConfirm = Boolean(result.error?.toLocaleLowerCase('tr-TR').includes('doğrulanmadı') || result.error?.toLowerCase().includes('confirm'));
    return { ok: result.ok, error: result.error, needsFavoriteClub: false, needsEmailConfirm };
  };

  const sendSignupCode = (email: string) => sendRegistrationOtp(email);

  const finishSignupWithCode = async (data: {
    email: string;
    token: string;
    nickname: string;
    password: string;
    favoriteTeamId: string;
    avatar: string;
  }) => {
    const result = await completeSignupWithOtp(data);
    if (result.ok && result.profile) {
      applySignedInProfile(result.profile);
      return { ok: true, needsFavoriteClub: !hasChosenFavoriteClub(result.profile) };
    }
    return { ok: false, error: result.error };
  };

  const sendResetCode = (email: string) => sendPasswordResetOtp(email);

  const finishResetWithCode = async (data: { email: string; token: string; password: string }) => {
    const result = await completePasswordResetWithOtp(data);
    if (result.ok && result.profile) {
      applySignedInProfile(result.profile);
      return { ok: true, needsFavoriteClub: !hasChosenFavoriteClub(result.profile) };
    }
    return { ok: false, error: result.error };
  };

  const logoutUser = () => {
    clubPromptedFor.current = null;
    void signOutSharedAccount();
    setUserProfile(DEFAULT_GUEST_PROFILE);
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(DEFAULT_GUEST_PROFILE));
    } catch {
      // ignore
    }
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...updates };
      if (updated.name) updated.name = censorProfanity(updated.name);
      if (updated.nickname) updated.nickname = censorProfanity(updated.nickname);
      if (updated.bio) updated.bio = censorProfanity(updated.bio);
      if (updated.username) updated.username = censorProfanity(updated.username);
      if (updated.favoriteTeamId) {
        const teamMeta = SUPER_LIG_TEAMS_LOOKUP[updated.favoriteTeamId] || { name: 'Süper Lig', badge: '⚽' };
        updated.favoriteTeamName = teamMeta.name;
        updated.favoriteTeamBadge = teamMeta.badge;
      }
      try {
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      void syncSharedProfilePatch(updated);
      return updated;
    });
  };

  const completeFavoriteClub = (teamId: string) => {
    const teamMeta = SUPER_LIG_TEAMS_LOOKUP[teamId];
    if (!teamMeta) {
      return { ok: false, error: 'Lütfen tuttuğunuz kulübü seçin.' };
    }
    updateUserProfile({
      favoriteTeamId: teamId,
      favoriteTeamName: teamMeta.name,
      favoriteTeamBadge: teamMeta.badge,
    });
    celebrateAndResume();
    return { ok: true };
  };

  useEffect(() => {
    let cancelled = false;
    const pullCount = async () => {
      const count = await fetchRegisteredUserCount();
      if (!cancelled && count != null) setRegisteredUserCount(count);
    };
    void pullCount();
    const id = window.setInterval(() => void pullCount(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;

    const hydrate = async () => {
      const { data } = await sb.auth.getSession();
      let profile = DEFAULT_GUEST_PROFILE;
      if (data.session?.user) {
        profile = await loadSharedProfile(data.session.user);
        setUserProfile(profile);
      }
      const cloudReviews = await loadWebReviews();
      if (cloudReviews.length) {
        setReviews((prev) => replaceReviewsFromCloud(prev, cloudReviews.map(sanitizeReview), profile));
      }
    };
    void hydrate();

    const { data: sub } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUserProfile(DEFAULT_GUEST_PROFILE);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await ensureWebProfile(session.user.user_metadata?.display_name, session.user.user_metadata?.avatar_emoji);
        const profile = await loadSharedProfile(session.user);
        setUserProfile(profile);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const pullCloudReviews = async () => {
      const cloud = await loadWebReviews();
      if (!cloud.length) return;
      setReviews((prev) => replaceReviewsFromCloud(prev, cloud.map(sanitizeReview), userProfile));
    };
    const id = window.setInterval(() => void pullCloudReviews(), 45_000);
    return () => window.clearInterval(id);
  }, [userProfile.id, userProfile.isRegistered]);

  useEffect(() => {
    if (!userProfile.isRegistered || hasChosenFavoriteClub(userProfile)) return;
    if (clubPromptedFor.current === userProfile.id) return;
    clubPromptedFor.current = userProfile.id;
    setIsQuickRegisterOpen(true);
  }, [userProfile]);

  const applyLivePayload = (data: any, fallbackToMock = false, opts?: { keepWeek?: boolean }) => {
    let started: Match[] | undefined;
    if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
      started = (data.matches as Match[]).map((match) => {
        if (match.status !== 'FT' && isMatchLive(match)) {
          return { ...match, status: 'LIVE' as const, minute: match.minute || 1 };
        }
        return match;
      });
      setMatches(started);
      for (const match of started) {
        if (match.homePlayers?.length || match.awayPlayers?.length) {
          hydratedWeeks.current.add(match.week);
        }
      }
      const homeWeek = deriveActiveWeek(started, data.league?.currentWeek || 1);
      if (!userPickedWeek.current && !opts?.keepWeek) {
        setSelectedWeekState(homeWeek);
      }
    } else if (fallbackToMock) {
      setMatches(INITIAL_MATCHES);
    }

    if (Array.isArray(data.standings) && data.standings.length > 0) {
      setStandings(data.standings);
    }
    if (data.league) {
      const leagueWeek = deriveActiveWeek(
        started || (Array.isArray(data.matches) ? data.matches : []),
        data.league.currentWeek || 1,
      );
      setLeagues([{ ...data.league, currentWeek: leagueWeek }]);
      setStandingsMeta({
        seasonLabel: String(data.league.name || '').match(/\(([^)]+)\)/)?.[1] || '2026/27',
        week: leagueWeek,
        updatedAt: data.lastSync || '',
      });
    }
    // Yorumlar fu_web_reviews'tan gelir. Canlı maç snapshot'ı eski listeyle üzerine yazmasın.
    if (data.lastSync) {
      const dt = new Date(data.lastSync);
      setLastLiveSyncTime(dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    if (data.source) {
      setLiveDataSource(data.source);
    }
  };

  // Load initial live data from backend
  useEffect(() => {
    const fetchLiveMatches = async () => {
      setIsLiveSyncing(true);
      try {
        const res = await fetch('/api/live/matches');
        if (res.ok) {
          const data = await res.json();
          applyLivePayload(data);
          if (!data.matches?.length) {
            const syncRes = await fetch('/api/live/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            if (syncRes.ok) {
              applyLivePayload(await syncRes.json(), true);
            }
          }
        }
      } catch (err) {
        console.info('Live data fetched from local store');
      } finally {
        setIsLiveSyncing(false);
      }
    };
    fetchLiveMatches();
  }, []);

  useEffect(() => {
    const pullLiveWeek = async () => {
      const dueWeeks = [...new Set(
        matchesRef.current
          .filter((m) => matchNeedsScoreRefresh(m) || matchNeedsLineupRefresh(m))
          .map((m) => m.week)
          .filter((week) => week > 0),
      )];
      if (!dueWeeks.length) return;
      try {
        for (const week of dueWeeks) {
          const res = await fetch('/api/live/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week }),
          });
          if (res.ok) applyLivePayload(await res.json());
        }
      } catch {
        // ignore
      }
    };
    const soon = window.setTimeout(() => void pullLiveWeek(), 2500);
    const id = window.setInterval(() => void pullLiveWeek(), 40_000);
    return () => {
      window.clearTimeout(soon);
      window.clearInterval(id);
    };
  }, [currentWeek]);

  const syncLiveMatches = async (weekNumber?: number) => {
    setIsLiveSyncing(true);
    try {
      const res = await fetch('/api/live/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekNumber || selectedWeek }),
      });
      if (res.ok) {
        applyLivePayload(await res.json());
      }
    } catch (err) {
      console.warn('Sync live matches error:', err);
    } finally {
      setIsLiveSyncing(false);
    }
  };

  const refreshLiveData = async () => {
    setIsLiveSyncing(true);
    try {
      const res = await fetch('/api/live/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: selectedWeek }),
      });
      if (res.ok) applyLivePayload(await res.json(), false, { keepWeek: true });
      const cloud = await loadWebReviews();
      setReviews((prev) => replaceReviewsFromCloud(prev, cloud.map(sanitizeReview), userProfile));
      const count = await fetchRegisteredUserCount();
      if (count != null) setRegisteredUserCount(count);
    } catch (err) {
      console.warn('Sayfa yenileme hatası:', err);
    } finally {
      setIsLiveSyncing(false);
    }
  };

  // Continuous Real-Time Match Clock Ticker for LIVE matches
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches((prevMatches) => {
        let hasLive = false;
        const updated = prevMatches.map((m) => {
          if (m.status !== 'FT' && m.status !== 'LIVE' && isMatchLive(m)) {
            hasLive = true;
            return { ...m, status: 'LIVE' as const, minute: m.minute || 1, liveSeconds: m.liveSeconds || 0 };
          }
          if (m.status === 'LIVE') {
            hasLive = true;
            const currentMin = typeof m.minute === 'number' ? m.minute : (parseInt(String(m.minute || '78'), 10) || 78);
            const currentSec = typeof m.liveSeconds === 'number' ? m.liveSeconds : 0;

            let nextSec = currentSec + 1;
            let nextMin = currentMin;

            if (nextSec >= 60) {
              nextSec = 0;
              nextMin = Math.min(nextMin + 1, 100);
            }

            return {
              ...m,
              minute: nextMin,
              liveSeconds: nextSec,
            };
          }
          return m;
        });

        return hasLive ? updated : prevMatches;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('fu_selected_week', String(selectedWeek));
  }, [selectedWeek]);

  useEffect(() => {
    sessionStorage.setItem('fu_active_view', activeView);
  }, [activeView]);

  useEffect(() => {
    if (selectedMatchId) sessionStorage.setItem('fu_selected_match', selectedMatchId);
  }, [selectedMatchId]);

  useEffect(() => {
    setReviews((prev) => prev.map((review) => stampReviewOwnership(review, userProfile)));
  }, [userProfile.id, userProfile.isRegistered, userProfile.name, userProfile.nickname]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  useEffect(() => {
    if (hydratedWeeks.current.has(selectedWeek)) return;
    const weekMatches = matches.filter((m) => m.week === selectedWeek);
    const needsDetail = weekMatches.some(
      (m) =>
        ((m.status === 'FT' || m.status === 'LIVE') && m.homePlayers.length === 0) ||
        matchNeedsLineupRefresh(m),
    );
    if (needsDetail) {
      hydratedWeeks.current.add(selectedWeek);
      void syncLiveMatches(selectedWeek);
    }
  }, [selectedWeek, matches]);

  // Current match
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0] || null;

  // Change selected match when league or week changes if current match not in league/week
  useEffect(() => {
    const available = matches.filter(m => m.leagueId === selectedLeagueId && m.week === selectedWeek);
    if (available.length > 0) {
      if (!available.some(m => m.id === selectedMatchId)) {
        setSelectedMatchId(available[0].id);
      }
    }
  }, [selectedLeagueId, selectedWeek, matches, selectedMatchId]);

  const addReview = (reviewData: Omit<PlayerReview, 'id' | 'createdAt' | 'likes' | 'likedByMe' | 'isUserSubmission'>) => {
    const targetMatch = matches.find((m) => m.id === reviewData.matchId);
    if (!canWriteMatchReview(targetMatch)) {
      console.warn('Maç başlamadan puan veya yorum yazılamaz.');
      return;
    }

    const scoredTeamId =
      reviewData.teamId ||
      (targetMatch &&
        [...targetMatch.homePlayers, ...targetMatch.awayPlayers].find((p) => p.id === reviewData.playerId)?.teamId);
    const allowScore = canRateTeam(scoredTeamId);
    const comment = (reviewData.comment || '').trim();
    if (!allowScore && !comment) {
      console.warn('Rakip takıma yalnızca yorum yazılabilir.');
      return;
    }

    const submitKey = `${reviewData.matchId}:${reviewData.playerId}:${comment}:${allowScore ? reviewData.rating ?? '' : ''}`;
    const nowMs = Date.now();
    if (lastReviewSubmit.current && lastReviewSubmit.current.key === submitKey && nowMs - lastReviewSubmit.current.at < 2000) {
      return;
    }
    lastReviewSubmit.current = { key: submitKey, at: nowMs };

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const newReview: PlayerReview = sanitizeReview({
      ...reviewData,
      rating: allowScore ? reviewData.rating : undefined,
      comment: comment.slice(0, 1000),
      id: `rev-user-${Date.now()}`,
      createdAt: formattedDate,
      likes: 1,
      likedByMe: true,
      dislikes: 0,
      dislikedByMe: false,
      isReportedByMe: false,
      isUserSubmission: true,
      authorUserId: userProfile.isRegistered ? userProfile.id : undefined,
    });

    setReviews(prev => [newReview, ...prev]);
    void saveWebReview(newReview, userProfile.isRegistered ? userProfile.id : undefined);
    void fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview),
    });

    // Confetti effect for rating participation
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }
  };

  const deleteReview = (reviewId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || !isOwnReview(target, userProfile)) return;
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    void deleteWebReview(reviewId);
    void fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' });
  };

  const toggleLikeReview = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id === reviewId) {
          const isLiked = !r.likedByMe;
          const wasDisliked = !!r.dislikedByMe;
          return {
            ...r,
            likedByMe: isLiked,
            likes: isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 0) - 1),
            dislikedByMe: isLiked ? false : r.dislikedByMe,
            dislikes: isLiked && wasDisliked ? Math.max(0, (r.dislikes || 0) - 1) : (r.dislikes || 0),
          };
        }
        return r;
      })
    );
  };

  const toggleDislikeReview = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id === reviewId) {
          const isDisliked = !r.dislikedByMe;
          const wasLiked = !!r.likedByMe;
          return {
            ...r,
            dislikedByMe: isDisliked,
            dislikes: isDisliked ? (r.dislikes || 0) + 1 : Math.max(0, (r.dislikes || 0) - 1),
            likedByMe: isDisliked ? false : r.likedByMe,
            likes: isDisliked && wasLiked ? Math.max(0, (r.likes || 0) - 1) : (r.likes || 0),
          };
        }
        return r;
      })
    );
  };

  const reportSpamReview = (reviewId: string, reason: string, note?: string) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            isReportedByMe: true,
            reportReason: reason,
            reportNote: note,
          };
        }
        return r;
      })
    );
  };

  const cancelSpamReport = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            isReportedByMe: false,
            reportReason: undefined,
            reportNote: undefined,
          };
        }
        return r;
      })
    );
  };

  const addReviewReply = (
    reviewId: string,
    replyComment: string,
    authorInfo?: { name?: string; fanOf?: string; avatar?: string }
  ) => {
    if (!replyComment || !replyComment.trim()) return;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const newReply: ReviewReply = sanitizeReply({
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reviewId,
      comment: replyComment.trim().slice(0, 1000),
      authorName: authorInfo?.name || userProfile.nickname || userProfile.name || 'Futbolsever',
      authorAvatar: authorInfo?.avatar || userProfile.avatar || '👤',
      authorFanOf: authorInfo?.fanOf || (userProfile.favoriteTeamId !== 'general' ? userProfile.favoriteTeamName : undefined),
      userTeamId: userProfile.favoriteTeamId,
      createdAt: formattedDate,
      likes: 1,
      likedByMe: true,
      dislikes: 0,
      dislikedByMe: false,
      isUserSubmission: true,
      isReportedByMe: false,
    });

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const currentReplies = r.replies || [];
          return {
            ...r,
            replies: [...currentReplies, newReply],
          };
        }
        return r;
      })
    );
  };

  const deleteReviewReply = (reviewId: string, replyId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId && r.replies) {
          return {
            ...r,
            replies: r.replies.filter((rep) => rep.id !== replyId),
          };
        }
        return r;
      })
    );
  };

  const toggleLikeReply = (reviewId: string, replyId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId && r.replies) {
          return {
            ...r,
            replies: r.replies.map((rep) => {
              if (rep.id === replyId) {
                const isLiked = !rep.likedByMe;
                const wasDisliked = !!rep.dislikedByMe;
                return {
                  ...rep,
                  likedByMe: isLiked,
                  likes: isLiked ? (rep.likes || 0) + 1 : Math.max(0, (rep.likes || 0) - 1),
                  dislikedByMe: isLiked ? false : rep.dislikedByMe,
                  dislikes: isLiked && wasDisliked ? Math.max(0, (rep.dislikes || 0) - 1) : (rep.dislikes || 0),
                };
              }
              return rep;
            }),
          };
        }
        return r;
      })
    );
  };

  const toggleDislikeReply = (reviewId: string, replyId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId && r.replies) {
          return {
            ...r,
            replies: r.replies.map((rep) => {
              if (rep.id === replyId) {
                const isDisliked = !rep.dislikedByMe;
                const wasLiked = !!rep.likedByMe;
                return {
                  ...rep,
                  dislikedByMe: isDisliked,
                  dislikes: isDisliked ? (rep.dislikes || 0) + 1 : Math.max(0, (rep.dislikes || 0) - 1),
                  likedByMe: isDisliked ? false : rep.likedByMe,
                  likes: isDisliked && wasLiked ? Math.max(0, (rep.likes || 0) - 1) : (rep.likes || 0),
                };
              }
              return rep;
            }),
          };
        }
        return r;
      })
    );
  };

  const reportSpamReply = (reviewId: string, replyId: string, reason: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId && r.replies) {
          return {
            ...r,
            replies: r.replies.map((rep) => {
              if (rep.id === replyId) {
                return { ...rep, isReportedByMe: true };
              }
              return rep;
            }),
          };
        }
        return r;
      })
    );
  };

  const cancelSpamReplyReport = (reviewId: string, replyId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId && r.replies) {
          return {
            ...r,
            replies: r.replies.map((rep) => {
              if (rep.id === replyId) {
                return { ...rep, isReportedByMe: false };
              }
              return rep;
            }),
          };
        }
        return r;
      })
    );
  };

  const voteMotm = (matchId: string, playerId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    const playerTeamId = targetMatch
      ? [...targetMatch.homePlayers, ...targetMatch.awayPlayers].find((p) => p.id === playerId)?.teamId
      : undefined;
    if (!canWriteMatchReview(targetMatch) || !canRateTeam(playerTeamId)) {
      console.warn('Maçın adamı oyu yalnızca maç başladıktan sonra ve tuttuğunuz takım için verilebilir.');
      return;
    }

    try {
      const votesKey = `${LOCAL_STORAGE_MOTM_VOTES}_${matchId}`;
      const hasVoted = localStorage.getItem(votesKey);
      if (hasVoted) {
        // already voted for this match
      }
      localStorage.setItem(votesKey, playerId);
      if (!hasVoted) {
        setUserMotmVoteCount((n) => n + 1);
      }
    } catch {
      // ignore
    }

    setMatches(prev =>
      prev.map(m => {
        if (m.id === matchId) {
          const updateHome = m.homePlayers.map(p =>
            p.id === playerId ? { ...p, motmVotes: (p.motmVotes || 0) + 1 } : p
          );
          const updateAway = m.awayPlayers.map(p =>
            p.id === playerId ? { ...p, motmVotes: (p.motmVotes || 0) + 1 } : p
          );
          return { ...m, homePlayers: updateHome, awayPlayers: updateAway };
        }
        return m;
      })
    );

    // Update selectedPlayer state if current
    if (selectedPlayer && selectedPlayer.id === playerId) {
      setSelectedPlayer(prev => prev ? { ...prev, motmVotes: (prev.motmVotes || 0) + 1 } : null);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const getPlayerReviews = (playerId: string, matchId: string) => {
    return reviews.filter(r => r.playerId === playerId && r.matchId === matchId);
  };

  const getPlayerAverageRating = (playerId: string, matchId?: string) => {
    const playerReviews = matchId
      ? reviews.filter((r) => r.playerId === playerId && r.matchId === matchId)
      : reviews.filter((r) => r.playerId === playerId);

    const scored = playerReviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
    if (scored.length === 0) {
      return { rating: 0, count: 0 };
    }

    const sum = scored.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const avg = sum / scored.length;
    return {
      rating: parseFloat(avg.toFixed(1)),
      count: scored.length,
    };
  };

  const getPlayerCommentCount = (playerId: string, matchId?: string) => {
    return matchId
      ? reviews.filter((r) => r.playerId === playerId && r.matchId === matchId && r.comment && r.comment.trim().length > 0).length
      : reviews.filter((r) => r.playerId === playerId && r.comment && r.comment.trim().length > 0).length;
  };

  const getTotw = (leagueId: string, week: number) => {
    const weekMatches = matches.filter((m) => m.leagueId === leagueId && m.week === week);
    const allPlayers: { player: Player; rating: number; count: number; match: Match }[] = [];

    weekMatches.forEach((m) => {
      [...m.homePlayers, ...m.awayPlayers].forEach((p) => {
        const avg = getPlayerAverageRating(p.id, m.id);
        allPlayers.push({ player: p, rating: avg.rating, count: avg.count, match: m });
      });
    });

    if (allPlayers.length === 0) {
      return { xi: [], mvp: null };
    }

    // Deduplicate by player id in case of duplicates
    const uniquePlayersMap = new Map<string, { player: Player; rating: number; count: number; match: Match }>();
    for (const item of allPlayers) {
      if (!uniquePlayersMap.has(item.player.id)) {
        uniquePlayersMap.set(item.player.id, item);
      }
    }
    const candidateList = Array.from(uniquePlayersMap.values());

    // Sort strictly by highest rating desc, then vote count, then statistical performance
    candidateList.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.count !== a.count) return b.count - a.count;
      const scoreA = (a.player.stats?.goals || 0) * 4 + (a.player.stats?.assists || 0) * 3 + (a.player.motmVotes || 0) * 0.5 + (a.player.stats?.passAccuracy || 0) * 0.02;
      const scoreB = (b.player.stats?.goals || 0) * 4 + (b.player.stats?.assists || 0) * 3 + (b.player.motmVotes || 0) * 0.5 + (b.player.stats?.passAccuracy || 0) * 0.02;
      return scoreB - scoreA;
    });

    // Group by positions
    const gks = candidateList.filter((x) => x.player.category === 'GK');
    const defs = candidateList.filter((x) => x.player.category === 'DEF');
    const mids = candidateList.filter((x) => x.player.category === 'MID');
    const fwds = candidateList.filter((x) => x.player.category === 'FWD');

    const selectedPlayerIds = new Set<string>();
    const xi: Player[] = [];

    // 1. Pick highest rated Goalkeeper
    if (gks.length > 0) {
      xi.push(gks[0].player);
      selectedPlayerIds.add(gks[0].player.id);
    }

    // 2. Pick top rated core outfield players (3 DEF, 3 MID, 1 FWD)
    const coreDefs = defs.slice(0, 3);
    coreDefs.forEach((d) => {
      xi.push(d.player);
      selectedPlayerIds.add(d.player.id);
    });

    const coreMids = mids.slice(0, 3);
    coreMids.forEach((m) => {
      xi.push(m.player);
      selectedPlayerIds.add(m.player.id);
    });

    const coreFwds = fwds.slice(0, 1);
    coreFwds.forEach((f) => {
      xi.push(f.player);
      selectedPlayerIds.add(f.player.id);
    });

    // 3. Fill remaining positions up to 11 with the highest rated outfield players remaining
    const remainingOutfieldCandidates = candidateList.filter(
      (c) => c.player.category !== 'GK' && !selectedPlayerIds.has(c.player.id)
    );

    for (const item of remainingOutfieldCandidates) {
      if (xi.length >= 11) break;

      const currentDefCount = xi.filter((p) => p.category === 'DEF').length;
      const currentMidCount = xi.filter((p) => p.category === 'MID').length;
      const currentFwdCount = xi.filter((p) => p.category === 'FWD').length;

      if (item.player.category === 'DEF' && currentDefCount < 5) {
        xi.push(item.player);
        selectedPlayerIds.add(item.player.id);
      } else if (item.player.category === 'MID' && currentMidCount < 5) {
        xi.push(item.player);
        selectedPlayerIds.add(item.player.id);
      } else if (item.player.category === 'FWD' && currentFwdCount < 3) {
        xi.push(item.player);
        selectedPlayerIds.add(item.player.id);
      }
    }

    // Fallback if still under 11
    if (xi.length < 11) {
      for (const item of candidateList) {
        if (!selectedPlayerIds.has(item.player.id)) {
          xi.push(item.player);
          selectedPlayerIds.add(item.player.id);
          if (xi.length === 11) break;
        }
      }
    }

    // Sort the final 11 players for MVP determination:
    // MVP is the player with the single highest rating in that week
    const sortedXiByRating = [...xi].sort((a, b) => {
      const avgA = getPlayerAverageRating(a.id);
      const avgB = getPlayerAverageRating(b.id);
      if (avgB.rating !== avgA.rating) return avgB.rating - avgA.rating;
      return avgB.count - avgA.count;
    });

    const mvp = sortedXiByRating[0] || null;
    return { xi, mvp };
  };

  const getUserReviews = () => {
    return reviews.filter((r) => isOwnReview(r, userProfile));
  };

  const getMyReviewsRepliesCount = (): number => {
    const authored = reviews.filter((r) => r.isUserSubmission === true);
    return authored.reduce((sum, r) => {
      if (!r.replies || r.replies.length === 0) return sum;
      // count all replies given to user reviews that have NOT been read yet
      const unreadOtherReplies = r.replies.filter(
        (rep) => !rep.isUserSubmission && !readReplyIds.includes(rep.id)
      );
      return sum + unreadOtherReplies.length;
    }, 0);
  };

  const myReviewsRepliesCount = getMyReviewsRepliesCount();

  const markAllRepliesAsRead = () => {
    const authored = reviews.filter((r) => r.isUserSubmission === true);
    const replyIdsToMark: string[] = [];
    authored.forEach((r) => {
      if (r.replies) {
        r.replies.forEach((rep) => {
          replyIdsToMark.push(rep.id);
        });
      }
    });
    setReadReplyIds((prev) => {
      const merged = Array.from(new Set([...prev, ...replyIdsToMark]));
      try {
        localStorage.setItem(LOCAL_STORAGE_READ_REPLIES_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  };

  const markReviewRepliesAsRead = (reviewId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || !target.replies) return;
    const replyIdsToMark = target.replies.map((rep) => rep.id);
    setReadReplyIds((prev) => {
      const merged = Array.from(new Set([...prev, ...replyIdsToMark]));
      try {
        localStorage.setItem(LOCAL_STORAGE_READ_REPLIES_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
  };

  const simulateIncomingReply = (targetReviewId?: string) => {
    let target = reviews.find((r) => targetReviewId ? r.id === targetReviewId : r.isUserSubmission);
    if (!target) {
      target = reviews[0];
      if (target) {
        target.isUserSubmission = true;
      }
    }
    if (!target) return;

    const mockCommenters = [
      { name: 'KadıköyBoğası', fanOf: 'Fenerbahçe', avatar: '🟡', comment: 'Çok yerinde bir analiz olmuş, özellikle ikinci yarıdaki taktiksel baskı maçı tamamen kopardı!' },
      { name: 'KaraKartal1903', fanOf: 'Beşiktaş', avatar: '🦅', comment: 'Katılıyorum! Bu form grafiğiyle haftaya derbide kilit rol oynayacaktır.' },
      { name: 'BordoMaviFırtına', fanOf: 'Trabzonspor', avatar: '🌊', comment: 'Objektif bir değerlendirme. Oyuncunun savunmaya yardımı da göz ardı edilmemeli.' },
      { name: 'TaktikUstadı', fanOf: 'Galatasaray', avatar: '🦁', comment: 'Hücum presi ve ceza sahası koşuları tam bir taktiksel ders niteliğindeydi.' },
      { name: 'GöztepeAşığı', fanOf: 'Göztepe', avatar: '🟡', comment: 'Harika bir bakış açısı, ligin temposunu yükselten bir performans oldu.' },
    ];

    const randomCommenter = mockCommenters[Math.floor(Math.random() * mockCommenters.length)];
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const newReply: ReviewReply = {
      id: `rep-sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reviewId: target.id,
      comment: randomCommenter.comment,
      authorName: randomCommenter.name,
      authorAvatar: randomCommenter.avatar,
      authorFanOf: randomCommenter.fanOf,
      createdAt: formattedDate,
      likes: Math.floor(Math.random() * 8) + 1,
      likedByMe: false,
      dislikes: 0,
      dislikedByMe: false,
      isUserSubmission: false,
      isReportedByMe: false,
    };

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === target.id) {
          return {
            ...r,
            isUserSubmission: true,
            replies: [...(r.replies || []), newReply],
          };
        }
        return r;
      })
    );
  };

  const addNewMatch = (match: Match) => {
    setMatches(prev => [match, ...prev]);
    setSelectedMatchId(match.id);
  };

  const openPlayerModal = (player: Player, matchId?: string) => {
    if (matchId && matchId !== selectedMatchId) {
      setSelectedMatchId(matchId);
    }
    setSelectedManager(null);
    setSelectedPlayer(player);
  };

  const openManagerModal = (manager: Manager, matchId?: string) => {
    if (matchId && matchId !== selectedMatchId) {
      setSelectedMatchId(matchId);
    }
    setSelectedPlayer(null);
    setSelectedManager(manager);
  };

  const getManagerReviews = (managerId: string, matchId?: string) => {
    return matchId
      ? reviews.filter((r) => (r.playerId === managerId || r.managerId === managerId) && r.matchId === matchId)
      : reviews.filter((r) => r.playerId === managerId || r.managerId === managerId);
  };

  const getManagerAverageRating = (managerId: string, matchId?: string) => {
    const mgrReviews = matchId
      ? reviews.filter((r) => (r.playerId === managerId || r.managerId === managerId) && r.matchId === matchId)
      : reviews.filter((r) => r.playerId === managerId || r.managerId === managerId);

    const scored = mgrReviews.filter((r) => typeof r.rating === 'number' && r.rating > 0);
    if (scored.length === 0) {
      return { rating: 0, count: 0 };
    }

    const sum = scored.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const avg = sum / scored.length;
    return {
      rating: parseFloat(avg.toFixed(1)),
      count: scored.length,
    };
  };

  const getManagerCommentCount = (managerId: string, matchId?: string) => {
    return matchId
      ? reviews.filter((r) => (r.playerId === managerId || r.managerId === managerId) && r.matchId === matchId && r.comment && r.comment.trim().length > 0).length
      : reviews.filter((r) => (r.playerId === managerId || r.managerId === managerId) && r.comment && r.comment.trim().length > 0).length;
  };

  const getAllManagersRanking = (week?: number): ManagerRankingItem[] => {
    const targetWeek = week || selectedWeek;
    const weekMatches = matches.filter((m) => m.week === targetWeek);
    const byTeam = new Map<string, { manager: Manager; team: Team; match?: Match }>();

    const takeManager = (team: Team | undefined, match: Match) => {
      const mgr = team?.manager;
      if (!team || !mgr?.name || byTeam.has(team.id)) return;
      byTeam.set(team.id, { manager: mgr, team, match });
    };

    for (const match of weekMatches) {
      takeManager(match.homeTeam, match);
      takeManager(match.awayTeam, match);
    }

    const fallbackMatches = [...matches].sort((a, b) => {
      const aPlayed = a.status === 'FT' || a.status === 'LIVE' ? 0 : 1;
      const bPlayed = b.status === 'FT' || b.status === 'LIVE' ? 0 : 1;
      if (aPlayed !== bPlayed) return aPlayed - bPlayed;
      const aDist = Math.abs(a.week - targetWeek);
      const bDist = Math.abs(b.week - targetWeek);
      if (aDist !== bDist) return aDist - bDist;
      return b.week - a.week;
    });

    for (const match of fallbackMatches) {
      takeManager(match.homeTeam, match);
      takeManager(match.awayTeam, match);
    }

    const rankingList: ManagerRankingItem[] = [...byTeam.values()].map(({ manager, team, match }) => {
      const weekMatch = weekMatches.find((m) => m.homeTeam.id === team.id || m.awayTeam.id === team.id);
      const ratingMatchId = weekMatch?.id || match?.id;
      const ratingData = getManagerAverageRating(manager.id, ratingMatchId);
      const commentsCount = getManagerCommentCount(manager.id, ratingMatchId);

      return {
        manager,
        team,
        match: weekMatch || match,
        rating: ratingData.rating,
        count: ratingData.count,
        commentsCount,
        week: targetWeek,
      };
    });

    rankingList.sort((a, b) => {
      if ((a.count === 0) !== (b.count === 0)) return b.count - a.count;
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.count !== a.count) return b.count - a.count;
      return a.manager.name.localeCompare(b.manager.name, 'tr');
    });

    return rankingList;
  };

  // Follower & Level System Logic
  const isFollowingUser = (authorName: string): boolean => {
    if (!authorName) return false;
    const cleanName = normalizePersonName(authorName);
    return followedCommentators.some(
      (f) => normalizePersonName(f.name) === cleanName || f.id === cleanName,
    );
  };

  const unfollowUser = (authorName: string) => {
    if (!authorName) return;
    const cleanName = normalizePersonName(authorName);
    setFollowedCommentators((prev) =>
      prev.filter((f) => normalizePersonName(f.name) !== cleanName && f.id !== cleanName),
    );
  };

  const toggleFollowUser = (authorName: string, authorData?: { avatar?: string; fanOf?: string; teamId?: string }): boolean => {
    if (!authorName) return false;
    const selfName = normalizePersonName(authorName);
    if (
      selfName &&
      (selfName === normalizePersonName(userProfile.name) ||
        selfName === normalizePersonName(userProfile.nickname))
    ) {
      return false;
    }

    if (!userProfile.isRegistered) {
      requireAuth(() => toggleFollowUser(authorName, authorData));
      return false;
    }

    const cleanName = authorName.trim();
    const isCurrentlyFollowing = isFollowingUser(cleanName);

    if (isCurrentlyFollowing) {
      unfollowUser(cleanName);
      return false;
    } else {
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      const newFollow: FollowedCommentator = {
        id: cleanName.toLowerCase().replace(/[^a-z0-9_]/gi, '-'),
        name: cleanName,
        avatar: authorData?.avatar || '👤',
        fanOf: authorData?.fanOf || undefined,
        teamId: authorData?.teamId || undefined,
        followedAt: dateStr,
      };

      setFollowedCommentators((prev) => [
        newFollow,
        ...prev.filter((f) => normalizePersonName(f.name) !== normalizePersonName(cleanName)),
      ]);

      try {
        confetti({
          particleCount: 35,
          spread: 45,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore
      }

      return true;
    }
  };

  // User Level & XP Calculations
  const userAuthoredReviews = reviews.filter((r) => isOwnReview(r, userProfile));
  const userReviewsCount = userAuthoredReviews.length;
  const likesOnReviews = userAuthoredReviews.reduce((sum, r) => sum + (r.likes || 0), 0);

  let userRepliesCount = 0;
  let likesOnReplies = 0;
  reviews.forEach((r) => {
    if (r.replies) {
      r.replies.forEach((rep) => {
        if (
          rep.isUserSubmission ||
          rep.authorName === userProfile.name ||
          (userProfile.nickname && rep.authorName === userProfile.nickname)
        ) {
          userRepliesCount++;
          likesOnReplies += (rep.likes || 0);
        }
      });
    }
  });

  const totalLikesReceived = likesOnReviews + likesOnReplies;
  const likesXp = totalLikesReceived * 25; // 25 XP per like on comments
  const reviewsXp = userReviewsCount * 50;  // 50 XP per review
  const repliesXp = userRepliesCount * 20;  // 20 XP per reply
  const registrationXp = isRegistered ? 50 : 0;
  const currentXp = likesXp + reviewsXp + repliesXp + registrationXp;

  let currentTierIndex = 0;
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (currentXp >= LEVEL_TIERS[i].minXp) {
      currentTierIndex = i;
      break;
    }
  }

  const currentTier = LEVEL_TIERS[currentTierIndex];
  const nextTier = LEVEL_TIERS[currentTierIndex + 1] || null;
  const currentLevelBaseXp = currentTier.minXp;
  const nextLevelXp = nextTier ? nextTier.minXp : currentLevelBaseXp + 1500;
  const xpInLevel = currentXp - currentLevelBaseXp;
  const xpNeededForLevel = nextLevelXp - currentLevelBaseXp;
  const progressPercentage = nextTier
    ? Math.min(100, Math.max(0, Math.round((xpInLevel / xpNeededForLevel) * 100)))
    : 100;
  const remainingXp = nextTier ? Math.max(0, nextLevelXp - currentXp) : 0;

  const userLevelInfo: UserLevelInfo = {
    level: currentTier.level,
    title: currentTier.title,
    badgeEmoji: currentTier.emoji,
    badgeColor: currentTier.color,
    currentXp,
    currentLevelBaseXp,
    nextLevelXp,
    xpInLevel,
    xpNeededForLevel,
    progressPercentage,
    remainingXp,
    likesXp,
    reviewsXp,
    repliesXp,
    totalLikesReceived,
    reviewsCount: userReviewsCount,
    repliesCount: userRepliesCount,
  };

  const followersCount = 0;

  const followingCount = followedCommentators.length;

  const getAuthorLevel = (authorName: string, likesHint: number = 0) => {
    if (!authorName) {
      const t = LEVEL_TIERS[0];
      return { level: 1, title: t.title, badgeEmoji: t.emoji, color: t.color, border: t.border, bg: t.bg };
    }

    if (authorName === userProfile.name || authorName === userProfile.nickname) {
      return {
        level: currentTier.level,
        title: currentTier.title,
        badgeEmoji: currentTier.emoji,
        color: currentTier.color,
        border: currentTier.border,
        bg: currentTier.bg,
      };
    }

    let pseudoXp = likesHint * 25 + 120;
    let hash = 0;
    for (let i = 0; i < authorName.length; i++) {
      hash = (hash << 5) - hash + authorName.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) % 1800;
    pseudoXp += seed;

    let tierIndex = 0;
    for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
      if (pseudoXp >= LEVEL_TIERS[i].minXp) {
        tierIndex = i;
        break;
      }
    }
    const t = LEVEL_TIERS[tierIndex];
    return {
      level: t.level,
      title: t.title,
      badgeEmoji: t.emoji,
      color: t.color,
      border: t.border,
      bg: t.bg,
    };
  };

  return (
    <AppContext.Provider
      value={{
        leagues,
        selectedLeagueId,
        setSelectedLeagueId,
        selectedWeek,
        setSelectedWeek,
        currentWeek,
        isPastWeek,
        canWriteMatchReview,
        matchWriteLock,
        canRateTeam,
        matches,
        standings,
        standingsMeta,
        selectedMatchId,
        setSelectedMatchId,
        selectedMatch,
        selectedPlayer,
        setSelectedPlayer,
        selectedManager,
        setSelectedManager,
        activeView,
        setActiveView,
        teamTab,
        setTeamTab,
        positionFilter,
        setPositionFilter,
        searchQuery,
        setSearchQuery,
        reviews,
        addReview,
        deleteReview,
        toggleLikeReview,
        toggleDislikeReview,
        reportSpamReview,
        cancelSpamReport,
        spamReportingReview,
        setSpamReportingReview,
        addReviewReply,
        deleteReviewReply,
        toggleLikeReply,
        toggleDislikeReply,
        reportSpamReply,
        cancelSpamReplyReport,
        voteMotm,
        userMotmVoteCount,
        getPlayerReviews,
        getPlayerAverageRating,
        getPlayerCommentCount,
        getManagerReviews,
        getManagerAverageRating,
        getManagerCommentCount,
        getAllManagersRanking,
        getTotw,
        getUserReviews,
        getMyReviewsRepliesCount,
        myReviewsRepliesCount,
        markAllRepliesAsRead,
        markReviewRepliesAsRead,
        simulateIncomingReply,
        addNewMatch,
        openPlayerModal,
        openManagerModal,
        isMyReviewsOpen,
        setIsMyReviewsOpen,
        isProfileOpen,
        setIsProfileOpen,
        userProfile,
        isRegistered,
        updateUserProfile,
        registerUser,
        loginUser,
        sendSignupCode,
        finishSignupWithCode,
        sendResetCode,
        finishResetWithCode,
        completeFavoriteClub,
        logoutUser,
        requireAuth,
        needsFavoriteClub,
        isQuickRegisterOpen,
        setIsQuickRegisterOpen,
        pendingAuthAction,
        setPendingAuthAction,
        isLiveSyncing,
        lastLiveSyncTime,
        liveDataSource,
        registeredUserCount,
        syncLiveMatches,
        refreshLiveData,
        isOwnReview: (review) => isOwnReview(review, userProfile),
        followedCommentators,
        toggleFollowUser,
        isFollowingUser,
        unfollowUser,
        followersCount,
        followingCount,
        userLevelInfo,
        getAuthorLevel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

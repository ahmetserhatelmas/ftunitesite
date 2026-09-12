export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Manager {
  id: string;
  name: string;
  shortName: string;
  teamId: string;
  avatar: string;
  role: 'Teknik Direktör';
  nationality?: string;
  formation?: string;
  baseRating?: number;
}

export interface ManagerRankingItem {
  manager: Manager;
  team: Team;
  match?: Match;
  rating: number;
  count: number;
  commentsCount: number;
  week?: number;
}

export interface PlayerStats {
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passAccuracy: number; // percentage e.g. 88
  tackles: number;
  interceptions: number;
  saves?: number; // for GK
  foulsCommitted: number;
  foulsDrawn: number;
  yellowCard: boolean;
  redCard: boolean;
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: string; // e.g. "ST", "CB", "CM", "GK", "LW", "RW", "RB", "LB"
  category: PositionCategory;
  avatar: string;
  teamId: string;
  isStarting: boolean;
  pitchPosition?: { x: number; y: number }; // Percentage 0-100 on half-pitch or full pitch
  stats: PlayerStats;
  baseRating: number; // e.g. 7.5
  motmVotes?: number;
}

export interface CommentTag {
  id: string;
  label: string;
  emoji: string;
  type: 'positive' | 'neutral' | 'negative';
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  authorName: string;
  authorAvatar?: string;
  authorFanOf?: string;
  userTeamId?: string;
  comment: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  dislikes?: number;
  dislikedByMe?: boolean;
  isUserSubmission?: boolean;
  isReportedByMe?: boolean;
}

export interface PlayerReview {
  id: string;
  playerId: string; // Player ID or Manager ID
  playerName?: string;
  playerNumber?: number;
  teamId?: string;
  teamName?: string;
  matchId: string;
  authorName: string;
  authorUserId?: string;
  authorAvatar?: string;
  authorTeamBadge?: string;
  authorFanOf?: string;
  rating?: number; // 1.0 - 10.0; yoksa yalnızca yorum
  comment: string;
  tags: string[]; // tag labels or ids (always empty for managers!)
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  dislikes?: number;
  dislikedByMe?: boolean;
  isReportedByMe?: boolean;
  reportReason?: string;
  reportNote?: string;
  isUserSubmission?: boolean;
  targetType?: 'player' | 'manager';
  managerId?: string;
  replies?: ReviewReply[];
}

export interface SpamReportOption {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface SpamReportData {
  reviewId: string;
  reason: string;
  note?: string;
  reportedAt: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  formation: string; // e.g. "4-2-3-1"
  manager?: Manager;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'goal-cancelled' | 'yellow-card' | 'red-card' | 'sub-in' | 'sub-out' | 'assist' | 'own-goal' | 'penalty';
  playerId: string;
  playerName: string;
  teamId: string;
  detail?: string;
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  week: number;
  date: string;
  kickoffAt?: string;
  stadium: string;
  referee: string;
  status: 'FT' | 'LIVE' | 'UPCOMING';
  /** API-SPORTS short: 1H / HT / 2H. HT = devre arası. */
  period?: '1H' | 'HT' | '2H' | 'ET';
  minute?: number | string;
  liveSeconds?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  homePlayers: Player[];
  awayPlayers: Player[];
  events: MatchEvent[];
  viewsCount?: number;
  /** API-SPORTS resmi ilk 11. */
  lineupConfirmed?: boolean;
  lineupSource?: 'official' | 'predicted';
  unavailablePlayers?: Array<{ id: string; name: string; reason: string; teamId: string }>;
}

export interface League {
  id: string;
  name: string;
  country: string;
  logo: string;
  currentWeek: number;
  totalWeeks: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  nickname?: string;
  email?: string;
  avatar: string;
  bio: string;
  favoriteTeamId: string;
  favoriteTeamName: string;
  favoriteTeamBadge: string;
  city: string;
  memberSince: string;
  title: string;
  isRegistered: boolean;
  followersCount?: number;
  followingCount?: number;
}

export interface FollowedCommentator {
  id: string;
  name: string;
  avatar?: string;
  fanOf?: string;
  teamId?: string;
  followedAt: string;
}

export interface UserLevelInfo {
  level: number;
  title: string;
  badgeEmoji: string;
  badgeColor: string;
  currentXp: number;
  currentLevelBaseXp: number;
  nextLevelXp: number;
  xpInLevel: number;
  xpNeededForLevel: number;
  progressPercentage: number;
  remainingXp: number;
  likesXp: number;
  reviewsXp: number;
  repliesXp: number;
  totalLikesReceived: number;
  reviewsCount: number;
  repliesCount: number;
}

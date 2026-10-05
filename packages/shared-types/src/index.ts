// Shared types for Free Fire Esports Core

export type UserRole = 'PLAYER' | 'SUPERVISOR' | 'ADMIN';

export type GameMode = 'BR_SOLO' | 'BR_DUO' | 'BR_SQUAD' | 'CS_4V4';
export type MapType = 'BERMUDA' | 'PURGATORY' | 'KALAHARI' | 'ALPINE' | 'NEXTERRA';
export type TournamentStatus = 'UPCOMING' | 'ROOM_OPEN' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET';
export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'ENTRY_FEE' | 'PRIZE_PAYOUT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AnomalyType = 'HEADSHOT_ANOMALY' | 'SPEED_HACK' | 'EMULATOR_MISMATCH' | 'RAPID_FIRE';

export interface UserProfile {
  id: string;
  phone: string;
  ign: string; // In-Game Name
  uid: string; // Free Fire UID (e.g. 192837465)
  role: UserRole;
  walletBalance: number;
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  isBanned: boolean;
  createdAt: string;
}

export interface TournamentSlot {
  slotNumber: number;
  userId?: string;
  ign?: string;
  teamName?: string;
  isOccupied: boolean;
}

export interface TournamentItem {
  id: string;
  title: string;
  gameMode: GameMode;
  mapType: MapType;
  entryFee: number;
  prizePool: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  perKillPrize: number;
  totalSlots: number;
  filledSlots: number;
  status: TournamentStatus;
  matchTime: string;
  roomId?: string | null;
  roomPass?: string | null;
  revealAt: string; // Typically 15 mins before matchTime
  slots?: TournamentSlot[];
}

export interface WalletTransactionItem {
  id: string;
  userId: string;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  phone: string;
  trxId: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface AntiCheatReport {
  id: string;
  userId: string;
  ign: string;
  tournamentId: string;
  anomalyType: AnomalyType;
  confidenceScore: number;
  details: string;
  snapshotUrl?: string;
  createdAt: string;
}

export interface BotSpectatorStatus {
  botId: string;
  activeTournamentId: string | null;
  status: 'IDLE' | 'CONNECTING' | 'IN_ROOM' | 'SPECTATING' | 'PARSING_RESULTS';
  fps: number;
  spectatorSlot: number;
  lastHeartbeat: string;
}

export interface KillfeedEvent {
  killerUid?: string;
  killerIgn: string;
  victimIgn: string;
  weapon: string;
  isHeadshot: boolean;
  timestamp: string;
}

export interface MatchScoreboardResult {
  tournamentId: string;
  rank: number;
  teamOrPlayer: string;
  kills: number;
  damage: number;
  isBooyah: boolean;
}

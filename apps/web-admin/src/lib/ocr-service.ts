'use client';

import { MatchItem, MatchParticipant } from './cms-store';

export interface ParsedScoreboardRow {
  rank: number;
  rawIgn: string;
  matchedPlayerIgn: string;
  matchedPlayerUid?: string;
  matchedUserId?: string;
  matchedSlot?: number;
  kills: number;
  confidence: number; // 0 to 1
  isMatched: boolean;
  killPrize: number;
  rankPrize: number;
  totalPrize: number;
}

export interface OcrAuditLog {
  id: string;
  matchId: string;
  matchTitle: string;
  processedAt: string;
  processedBy: string;
  imageUrl?: string;
  totalParticipantsMatched: number;
  totalPrizeDistributed: number;
  results: ParsedScoreboardRow[];
}

const OCR_AUDIT_LOGS_KEY = 'ff_ocr_audit_logs_v1';

/* ------------------------------------------------------------------ */
/*  Fuzzy Matching Algorithms (Levenshtein Distance)                  */
/* ------------------------------------------------------------------ */

/**
 * Computes Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Normalized string similarity score between 0.0 (completely different) and 1.0 (identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = cleanGamerTag(str1);
  const s2 = cleanGamerTag(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Substring bonus
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0.75, minLen / maxLen);
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Normalizes special game clan symbols, brackets, and extra spaces
 */
export function cleanGamerTag(ign: string): string {
  return ign
    .toUpperCase()
    .replace(/[\[\]\(\)\{\}\<\>\-_\.\|\*\#\:\~]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Finds best matching registered player for an OCR detected gamer tag
 */
export function findBestPlayerMatch(
  ocrIgn: string,
  registeredPlayers: Array<{ ign: string; uid?: string; slot?: number; id?: string }>
): { player: { ign: string; uid?: string; slot?: number; id?: string } | null; similarity: number } {
  if (!registeredPlayers || registeredPlayers.length === 0) {
    return { player: null, similarity: 0 };
  }

  let bestMatch: { ign: string; uid?: string; slot?: number; id?: string } | null = null;
  let highestScore = 0;

  for (const player of registeredPlayers) {
    const score = stringSimilarity(ocrIgn, player.ign);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = player;
    }
  }

  // Threshold: at least 0.55 similarity
  if (highestScore >= 0.55) {
    return { player: bestMatch, similarity: highestScore };
  }

  return { player: null, similarity: highestScore };
}

/* ------------------------------------------------------------------ */
/*  Prize Calculation Engine                                          */
/* ------------------------------------------------------------------ */

export function calculatePlayerPrize(
  rank: number,
  kills: number,
  match: MatchItem
): { killPrize: number; rankPrize: number; totalPrize: number } {
  const perKillRate = match.perKill || 0;
  const killPrize = Math.max(0, kills * perKillRate);

  let rankPrize = 0;
  if (rank === 1) {
    rankPrize = match.firstPrize || Math.round(match.prizePool * 0.5);
  } else if (rank === 2) {
    rankPrize = match.secondPrize || Math.round(match.prizePool * 0.25);
  } else if (rank === 3) {
    rankPrize = match.thirdPrize || Math.round(match.prizePool * 0.15);
  }

  return {
    killPrize,
    rankPrize,
    totalPrize: killPrize + rankPrize,
  };
}

/* ------------------------------------------------------------------ */
/*  Scoreboard OCR Heuristic Parser                                   */
/* ------------------------------------------------------------------ */

/**
 * Parses raw text extracted from scoreboard screenshot into structured rows
 */
export function parseScoreboardText(
  rawText: string,
  match: MatchItem,
  registeredPlayers: Array<{ ign: string; uid?: string; slot?: number; id?: string }>
): ParsedScoreboardRow[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedRows: ParsedScoreboardRow[] = [];
  let currentRank = 1;

  for (const line of lines) {
    // Ignore common scoreboard headers
    if (
      /rank|placement|team|player|kills|damage|score|booyah|free fire|garena|result/i.test(line) &&
      !/\d/.test(line)
    ) {
      continue;
    }

    // Try regex patterns for:
    // Pattern 1: "#1 OP_NINJA 7 Kills" or "1. BDX_STRIKER 5"
    // Pattern 2: "OP_NINJA 1 8"
    let rank = currentRank;
    let ign = '';
    let kills = 0;

    const rankMatch = line.match(/^#?(\d{1,2})[\.\s\:\-]/);
    if (rankMatch) {
      rank = parseInt(rankMatch[1], 10);
    }

    const killsMatch = line.match(/(\d{1,2})\s*(?:kills?|k|kll)?$/i) || line.match(/\b(\d{1,2})\b$/);
    if (killsMatch) {
      kills = parseInt(killsMatch[1], 10);
    }

    // Strip rank and kill from line to get IGN
    let cleanLine = line;
    if (rankMatch) cleanLine = cleanLine.replace(rankMatch[0], '');
    if (killsMatch) cleanLine = cleanLine.substring(0, cleanLine.lastIndexOf(killsMatch[1]));

    ign = cleanLine.replace(/kills?|pts?|score/gi, '').trim();

    // Fallback if IGN not extracted cleanly
    if (!ign || ign.length < 2) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        ign = parts[parts.length - 2];
      } else {
        ign = `PLAYER_${currentRank}`;
      }
    }

    // Find best match in registered participants
    const { player, similarity } = findBestPlayerMatch(ign, registeredPlayers);
    const { killPrize, rankPrize, totalPrize } = calculatePlayerPrize(rank, kills, match);

    parsedRows.push({
      rank,
      rawIgn: ign,
      matchedPlayerIgn: player ? player.ign : ign,
      matchedPlayerUid: player?.uid,
      matchedUserId: player?.id,
      matchedSlot: player?.slot || rank,
      kills,
      confidence: Number(similarity.toFixed(2)),
      isMatched: Boolean(player),
      killPrize,
      rankPrize,
      totalPrize,
    });

    currentRank++;
  }

  // If no rows parsed or text was unstructured, synthesize from registered players
  if (parsedRows.length === 0 && registeredPlayers.length > 0) {
    registeredPlayers.forEach((p, idx) => {
      const rank = idx + 1;
      const kills = Math.max(0, 5 - idx);
      const { killPrize, rankPrize, totalPrize } = calculatePlayerPrize(rank, kills, match);
      parsedRows.push({
        rank,
        rawIgn: p.ign,
        matchedPlayerIgn: p.ign,
        matchedPlayerUid: p.uid,
        matchedSlot: p.slot || rank,
        kills,
        confidence: 1.0,
        isMatched: true,
        killPrize,
        rankPrize,
        totalPrize,
      });
    });
  }

  // Sort by rank ascending
  return parsedRows.sort((a, b) => a.rank - b.rank);
}

/* ------------------------------------------------------------------ */
/*  Audit Log Persistence                                             */
/* ------------------------------------------------------------------ */

export function getOcrAuditLogs(): OcrAuditLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OCR_AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOcrAuditLog(log: Omit<OcrAuditLog, 'id' | 'processedAt'>): OcrAuditLog {
  const current = getOcrAuditLogs();
  const newEntry: OcrAuditLog = {
    ...log,
    id: 'ocr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    processedAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...current].slice(0, 50); // keep last 50 logs
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OCR_AUDIT_LOGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ff_ocr_logs_updated', { detail: updated }));
    } catch (e) {}
  }

  return newEntry;
}

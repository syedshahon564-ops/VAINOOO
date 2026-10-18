import fs from 'fs';
import path from 'path';
import { generateAdvancedAiResponse } from './ai-assistant';

export interface AiCustomRule {
  id: string;
  keywords: string[];
  response: string;
  category?: string;
  enabled: boolean;
}

export interface AiSupportConfig {
  systemPrompt: string;
  autoVerifyPayments: boolean;
  autoReplyDelayMs: number;
  customRules: AiCustomRule[];
}

export interface TicketMessage {
  id: string;
  senderRole: 'USER' | 'ADMIN' | 'AI_BOT';
  senderName: string;
  message: string;
  imageUrl?: string;
  timestamp: string;
  isAi?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userPhone: string;
  userIgn: string;
  subject: string;
  category: 'PAYMENT' | 'MATCH' | 'ACCOUNT' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  matchId?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  paymentVerified?: boolean;
  verifiedTrxId?: string;
  verifiedAmount?: number;
}

export const DEFAULT_AI_CONFIG: AiSupportConfig = {
  systemPrompt:
    'You are the official 24/7 AI Support Assistant for FF RIVAL TOUR BD. You assist players with tournament inquiries, custom room credentials, payment verifications, and anti-cheat policies.',
  autoVerifyPayments: true,
  autoReplyDelayMs: 600,
  customRules: [
    {
      id: 'rule-room-pass',
      keywords: ['room', 'password', 'pass', 'id', 'রুম', 'পাসওয়ার্ড'],
      response:
        'Custom Room ID and Password will appear automatically under "My Matches" 10 to 15 minutes before the match start time. Make sure to sit in your exact assigned slot!',
      category: 'MATCH',
      enabled: true,
    },
    {
      id: 'rule-deposit-delay',
      keywords: ['deposit', 'bdt', 'bkash', 'nagad', 'বিকাশ', 'নগদ', 'টাকা আসেনি', 'ব্যালেন্স'],
      response:
        'bKash and Nagad deposits are verified in real time! If you attached your Transaction ID (TrxID) or screenshot, our AI payment processor will verify and credit your balance within minutes.',
      category: 'PAYMENT',
      enabled: true,
    },
    {
      id: 'rule-withdraw',
      keywords: ['withdraw', 'cashout', 'উইথড্র', 'টাকা তোলা'],
      response:
        'Withdrawals are processed directly to your personal bKash/Nagad wallet within 1 to 2 hours. Minimum withdrawal is 100 BDT.',
      category: 'PAYMENT',
      enabled: true,
    },
    {
      id: 'rule-slot',
      keywords: ['slot', 'squad', 'স্লট', 'স্কোয়াড'],
      response:
        'For Solo & Duo matches, slots are assigned automatically upon joining. For Squad matches, your team captain selects your designated slot (1 to 12).',
      category: 'MATCH',
      enabled: true,
    },
  ],
};

function getAiConfigPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'ai-support-config.json'),
    path.join(process.cwd(), 'data', 'ai-support-config.json'),
    path.join('/tmp', 'ai-support-config.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'ai-support-config.json');
}

export function readAiConfig(): AiSupportConfig {
  try {
    const filePath = getAiConfigPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_AI_CONFIG;
}

export function saveAiConfig(config: AiSupportConfig): void {
  const filePath = getAiConfigPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    try {
      const tmpPath = path.join('/tmp', 'ai-support-config.json');
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {}
  }
}

function getTicketsFilePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'support-tickets.json'),
    path.join(process.cwd(), 'data', 'support-tickets.json'),
    path.join('/tmp', 'support-tickets.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'support-tickets.json');
}

export function readTickets(): SupportTicket[] {
  try {
    const filePath = getTicketsFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveTickets(tickets: SupportTicket[]): void {
  const filePath = getTicketsFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2), 'utf-8');
  } catch (e) {
    try {
      const tmpPath = path.join('/tmp', 'support-tickets.json');
      fs.writeFileSync(tmpPath, JSON.stringify(tickets, null, 2), 'utf-8');
    } catch (err) {}
  }
}

export function detectLanguage(text: string): 'BANGLA' | 'BANGLISH' | 'ENGLISH' {
  if (!text) return 'ENGLISH';
  // Check for Bengali Unicode characters
  if (/[\u0980-\u09FF]/.test(text)) return 'BANGLA';

  const banglishTokens = [
    'kemon', 'kmn', 'acho', 'aso', 'achen', 'asen', 'achi', 'asi',
    'kivabe', 'kivhabe', 'kibabe', 'kemne', 'keno', 'kn', 'kobe', 'kokhon', 'kkn',
    'taka', 'tk', 'poisa', 'pabo', 'pawa', 'jabe', 'jbo', 'diben', 'dibo', 'dite',
    'amr', 'amar', 'tomar', 'tmr', 'apnar', 'apni', 'tumi', 'tui', 'vai', 'bhai',
    'bro', 'bhaia', 'vaia', 'somossa', 'shomossha', 'lagbe', 'parbo', 'parchi',
    'parbona', 'korbo', 'korchi', 'korte', 'koro', 'bolo', 'bolun', 'bolte',
    'bhalo', 'valo', 'vlo', 'shuru', 'suru', 'hobe', 'hoise', 'hoini', 'hoi',
    'nai', 'gese', 'cole', 'chole', 'khulbe', 'asche', 'ashe', 'aseni', 'payechi',
    'dekhbo', 'dekhen', 'dekhi', 'bolbo', 'shunte', 'parben', 'dhukbo', 'dhukte',
    'boshbo', 'boshte', 'bosbo', 'boshe', 'boisa', 'ki', 'khobor', 'obostha', 'jantam'
  ];

  const words = text.toLowerCase().split(/[^a-zA-Z0-9]+/);
  for (const w of words) {
    if (banglishTokens.includes(w)) return 'BANGLISH';
  }
  return 'ENGLISH';
}

export function processAiResponse(
  ticket: Partial<SupportTicket>,
  userMessage: string,
  imageUrl?: string
): { response: string; paymentVerified?: boolean; verifiedTrxId?: string; verifiedAmount?: number } {
  const config = readAiConfig();
  const query = (userMessage + ' ' + (ticket.subject || '')).toLowerCase();
  const ign = ticket.userIgn || 'Player';
  const lang = detectLanguage(userMessage + ' ' + (ticket.subject || ''));

  // 1. Check Admin's Custom Rules FIRST
  if (Array.isArray(config.customRules)) {
    for (const rule of config.customRules) {
      if (rule.enabled && Array.isArray(rule.keywords)) {
        const matches = rule.keywords.some((kw) => query.includes(kw.toLowerCase().trim()));
        if (matches && rule.response && rule.response.trim().length > 0) {
          return { response: rule.response.trim() };
        }
      }
    }
  }

  // 2. Delegate to the Advanced Multilingual AI Assistant Engine
  return generateAdvancedAiResponse({
    userMessage,
    userIgn: ticket.userIgn,
    category: ticket.category,
    subject: ticket.subject,
    imageUrl,
  });
}

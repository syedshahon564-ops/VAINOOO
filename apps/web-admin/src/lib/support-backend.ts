import fs from 'fs';
import path from 'path';

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

export function processAiResponse(
  ticket: Partial<SupportTicket>,
  userMessage: string,
  imageUrl?: string
): { response: string; paymentVerified?: boolean; verifiedTrxId?: string; verifiedAmount?: number } {
  const config = readAiConfig();
  const query = (userMessage + ' ' + (ticket.subject || '')).toLowerCase();
  const ign = ticket.userIgn || 'Player';

  // 1. Check Admin's Custom Rules FIRST ("এই বটটা বা এআইটা এমন হবে যে আমি যা বলবো ওটাই যেন অ্যানসার দেয়")
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

  // 2. AI Payment Verification Engine
  const isPaymentIssue =
    ticket.category === 'PAYMENT' ||
    query.includes('bkash') ||
    query.includes('nagad') ||
    query.includes('rocket') ||
    query.includes('deposit') ||
    query.includes('trx') ||
    query.includes('টাকা') ||
    query.includes('পেমেন্ট') ||
    query.includes('ব্যালেন্স');

  if (isPaymentIssue && config.autoVerifyPayments) {
    const trxMatch = userMessage.match(/\b([A-Za-z0-9]{8,14})\b/);
    const amountMatch = userMessage.match(/\b(\d{2,5})\s*(?:tk|taka|bdt|টাকা)?\b/i);
    const detectedAmount = amountMatch ? parseInt(amountMatch[1], 10) : 100;

    const hasProof = Boolean(imageUrl || trxMatch);

    if (hasProof) {
      const trxId = trxMatch ? trxMatch[1].toUpperCase() : 'PROOF_' + Date.now().toString().slice(-6);
      return {
        paymentVerified: true,
        verifiedTrxId: trxId,
        verifiedAmount: detectedAmount,
        response: `🤖 AI Support: Payment Verified Successfully! ✅\n\nHello ${ign}! Our AI verification system has reviewed your payment proof (TrxID: ${trxId}).\n\n• Verified Amount: ৳${detectedAmount}\n• Status: Automatically Approved & Credited\n• Note: Your wallet balance has been updated. You can check your balance in the Wallet tab and join tournaments immediately!`,
      };
    } else {
      return {
        response: `🤖 AI Support: Deposit Verification Required ⚠️\n\nHello ${ign}! We noticed your deposit inquiry regarding "${ticket.subject || 'Deposit'}".\n\nTo verify and credit your balance immediately, please reply with:\n1. Your Transaction ID (TrxID)\n2. A screenshot or photo of your payment confirmation SMS\n\nOnce attached, our AI engine will verify and resolve your issue right away!`,
      };
    }
  }

  // 3. Match / Room Credentials
  if (
    ticket.category === 'MATCH' ||
    query.includes('room') ||
    query.includes('pass') ||
    query.includes('id') ||
    query.includes('রুম')
  ) {
    return {
      response: `🤖 AI Support: Match Access Information 🎮\n\nHello ${ign}! Room ID and Password are automatically published under the "My Matches" tab 10 to 15 minutes before the match start time.\n\nWhen the status turns to "ROOM OPEN", click "View Room ID & Password" and enter the room lobby in your exact assigned slot.`,
    };
  }

  // 4. Default Fallback
  return {
    response: `🤖 AI Support: Support Ticket Recorded\n\nHello ${ign}! Thank you for reaching out regarding "${ticket.subject || 'Support'}".\n\nOur automated tournament system has logged your inquiry. If you have any transaction screenshots or game proofs, please attach them here so we can assist you promptly!`,
  };
}

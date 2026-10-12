import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

export const VAPID_KEYS = {
  publicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    'BNjVYarxrNIk8oP-Df6rQgQbaVb-F8fzn7QmGsPQ5CC-6ikTGborOpu_Dpz8699GwW2Wyzzl-6RL6ehDXzO010k',
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    'kItqZNvDKIJKrIzriFBzVodp_QthERqwdeL1QS1KWLE',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@ffrivalstour.app',
};

// Configure web-push with VAPID details
try {
  webpush.setVapidDetails(
    VAPID_KEYS.subject,
    VAPID_KEYS.publicKey,
    VAPID_KEYS.privateKey
  );
} catch (err) {
  console.warn('Failed to configure web-push VAPID details:', err);
}

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  subscribedAt: string;
  userAgent?: string;
  userId?: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  sentAt: string;
  totalSubscribers: number;
  successCount: number;
  failureCount: number;
}

function getSubPaths(): string[] {
  return [
    path.join(process.cwd(), 'data', 'push-subscriptions.json'),
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'push-subscriptions.json'),
    '/tmp/push-subscriptions.json',
  ];
}

function getHistoryPaths(): string[] {
  return [
    path.join(process.cwd(), 'data', 'notifications-history.json'),
    path.join(process.cwd(), 'apps', 'web-admin', 'data', 'notifications-history.json'),
    '/tmp/notifications-history.json',
  ];
}

export function getSubscriptions(): PushSubscriptionRecord[] {
  for (const p of getSubPaths()) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
      }
    } catch {}
  }
  return [];
}

export function saveSubscriptions(subs: PushSubscriptionRecord[]): void {
  const json = JSON.stringify(subs, null, 2);
  for (const p of getSubPaths()) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, json, 'utf-8');
    } catch {}
  }
}

export function getNotificationHistory(): NotificationRecord[] {
  for (const p of getHistoryPaths()) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data;
      }
    } catch {}
  }
  return [];
}

export function saveNotificationHistory(history: NotificationRecord[]): void {
  const json = JSON.stringify(history, null, 2);
  for (const p of getHistoryPaths()) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, json, 'utf-8');
    } catch {}
  }
}

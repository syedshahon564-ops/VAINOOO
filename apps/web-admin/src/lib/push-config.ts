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

let inMemorySubs: PushSubscriptionRecord[] | null = null;
let inMemoryHistory: NotificationRecord[] | null = null;

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
  if (inMemorySubs && inMemorySubs.length > 0) {
    return inMemorySubs;
  }
  for (const p of getSubPaths()) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          inMemorySubs = data;
          return data;
        }
      }
    } catch {}
  }
  return inMemorySubs || [];
}

export function saveSubscriptions(subs: PushSubscriptionRecord[]): void {
  inMemorySubs = subs;
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
  if (inMemoryHistory && inMemoryHistory.length > 0) {
    return inMemoryHistory;
  }
  for (const p of getHistoryPaths()) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          inMemoryHistory = data;
          return data;
        }
      }
    } catch {}
  }
  return inMemoryHistory || [];
}

export function saveNotificationHistory(history: NotificationRecord[]): void {
  inMemoryHistory = history;
  const json = JSON.stringify(history, null, 2);
  for (const p of getHistoryPaths()) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, json, 'utf-8');
    } catch {}
  }
}

/**
 * Universal server-side push notification dispatcher.
 * Delivers Web Push to all registered devices and records to public notification feed.
 */
export async function sendServerPushNotification(
  title: string,
  message: string,
  url: string = '/',
  icon: string = '/icon-192.png'
): Promise<{ success: boolean; totalSubscribers: number; successCount: number; failureCount: number; notification: NotificationRecord }> {
  const cleanTitle = (title || 'FF Rivals').trim();
  const cleanBody = (message || '').trim();
  const cleanUrl = url || '/';
  const cleanIcon = icon || '/icon-192.png';

  const payload = JSON.stringify({
    title: cleanTitle,
    body: cleanBody,
    url: cleanUrl,
    icon: cleanIcon,
    badge: '/icon-192.png',
    timestamp: Date.now(),
  });

  const subscriptions = getSubscriptions();
  let successCount = 0;
  let failureCount = 0;
  const remainingSubscriptions: PushSubscriptionRecord[] = [];

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload,
        {
          TTL: 86400, // 24 hours
          urgency: 'high',
        }
      );
      successCount++;
      remainingSubscriptions.push(sub);
    } catch (err: any) {
      failureCount++;
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Expired subscription, remove
      } else {
        remainingSubscriptions.push(sub);
      }
    }
  });

  if (sendPromises.length > 0) {
    await Promise.all(sendPromises);
  }

  if (remainingSubscriptions.length !== subscriptions.length) {
    saveSubscriptions(remainingSubscriptions);
  }

  const historyRecord: NotificationRecord = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    title: cleanTitle,
    body: cleanBody,
    url: cleanUrl,
    icon: cleanIcon,
    sentAt: new Date().toISOString(),
    totalSubscribers: subscriptions.length,
    successCount,
    failureCount,
  };

  const currentHistory = getNotificationHistory();
  const updatedHistory = [historyRecord, ...currentHistory.filter((h) => h.id !== historyRecord.id)].slice(0, 50);
  saveNotificationHistory(updatedHistory);

  return {
    success: true,
    totalSubscribers: subscriptions.length,
    successCount,
    failureCount,
    notification: historyRecord,
  };
}

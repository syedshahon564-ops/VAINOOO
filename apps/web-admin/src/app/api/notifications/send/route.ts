import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import {
  getSubscriptions,
  saveSubscriptions,
  getNotificationHistory,
  saveNotificationHistory,
  NotificationRecord,
  PushSubscriptionRecord,
} from '@/lib/push-config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, url, icon } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title.trim(),
      body: message.trim(),
      url: url || '/',
      icon: icon || '/icon-192.png',
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
        // If statusCode is 404 or 410, the subscription has expired or unsubscribed
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Do not retain expired subscription
        } else {
          remainingSubscriptions.push(sub);
        }
      }
    });

    await Promise.all(sendPromises);

    // Save cleaned subscriptions if any expired ones were removed
    if (remainingSubscriptions.length !== subscriptions.length) {
      saveSubscriptions(remainingSubscriptions);
    }

    // Save notification history
    const historyRecord: NotificationRecord = {
      id: 'notif-' + Date.now(),
      title: title.trim(),
      body: message.trim(),
      url: url || '/',
      icon: icon || '/icon-192.png',
      sentAt: new Date().toISOString(),
      totalSubscribers: subscriptions.length,
      successCount,
      failureCount,
    };

    const history = getNotificationHistory();
    history.unshift(historyRecord);
    // Keep last 50 notifications
    saveNotificationHistory(history.slice(0, 50));

    return NextResponse.json({
      success: true,
      totalSubscribers: subscriptions.length,
      successCount,
      failureCount,
      notification: historyRecord,
    });
  } catch (err: any) {
    console.error('Send notification error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

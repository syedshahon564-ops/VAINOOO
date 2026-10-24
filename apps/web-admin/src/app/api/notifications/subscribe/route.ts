import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptions,
  saveSubscriptions,
  PushSubscriptionRecord,
} from '@/lib/push-config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId, userPhone, userUid, userIgn } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription payload' },
        { status: 400 }
      );
    }

    const currentSubs = getSubscriptions();
    const existingIndex = currentSubs.findIndex(
      (s) => s.endpoint === subscription.endpoint
    );

    const record: PushSubscriptionRecord = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime || null,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      subscribedAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || undefined,
      userId: userId || undefined,
      userPhone: userPhone || undefined,
      userUid: userUid || undefined,
      userIgn: userIgn || undefined,
    };

    if (existingIndex >= 0) {
      currentSubs[existingIndex] = record;
    } else {
      currentSubs.push(record);
    }

    saveSubscriptions(currentSubs);

    return NextResponse.json({
      success: true,
      subscribersCount: currentSubs.length,
    });
  } catch (err: any) {
    console.error('Subscription error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

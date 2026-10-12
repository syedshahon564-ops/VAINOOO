import { NextResponse } from 'next/server';
import {
  getSubscriptions,
  getNotificationHistory,
} from '@/lib/push-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const subscriptions = getSubscriptions();
  const notifications = getNotificationHistory();

  return NextResponse.json({
    subscribersCount: subscriptions.length,
    notifications,
  });
}

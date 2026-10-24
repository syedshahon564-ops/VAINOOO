import { NextRequest, NextResponse } from 'next/server';
import {
  sendServerPushNotification,
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

    const result = await sendServerPushNotification(title, message, url, icon);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Send notification error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

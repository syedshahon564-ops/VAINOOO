import { NextRequest, NextResponse } from 'next/server';
import { POST as paymentPostHandler, GET as paymentGetHandler } from '../../webhook/payment/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    if (!url.searchParams.has('key')) {
      url.searchParams.set('key', 'ff_rivals_secure_sms_key_2026');
    }
    const bodyText = await req.text();
    const clonedReq = new Request(url.toString(), {
      method: 'POST',
      headers: req.headers,
      body: bodyText,
    });
    return paymentPostHandler(clonedReq);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    ok: true,
    webhookId: params.id,
    service: 'FF Rivals WebhookFlow Bridge Endpoint',
    status: 'CONNECTED',
    connected: true,
    instructions: 'Send POST requests with Nagad/bKash SMS or transaction payload',
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

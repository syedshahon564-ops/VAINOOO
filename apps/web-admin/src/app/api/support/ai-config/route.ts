import { NextResponse } from 'next/server';
import { readAiConfig, saveAiConfig, AiSupportConfig } from '@/lib/support-backend';

export async function GET() {
  const config = readAiConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = readAiConfig();
    const updated: AiSupportConfig = {
      systemPrompt: body.systemPrompt !== undefined ? body.systemPrompt : current.systemPrompt,
      autoVerifyPayments:
        body.autoVerifyPayments !== undefined ? Boolean(body.autoVerifyPayments) : current.autoVerifyPayments,
      autoReplyDelayMs:
        body.autoReplyDelayMs !== undefined ? Number(body.autoReplyDelayMs) : current.autoReplyDelayMs,
      customRules: Array.isArray(body.customRules) ? body.customRules : current.customRules,
    };
    saveAiConfig(updated);
    return NextResponse.json({ ok: true, config: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

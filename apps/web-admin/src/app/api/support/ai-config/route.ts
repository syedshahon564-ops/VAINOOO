import { NextResponse } from 'next/server';
import { readAiConfig, saveAiConfig, AiSupportConfig } from '@/lib/support-backend';

export async function GET() {
  const config = readAiConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if testing Gemini connection
    if (body.action === 'test_gemini') {
      const apiKeyToTest = (
        body.apiKey ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        readAiConfig().geminiApiKey ||
        ''
      ).trim();

      if (!apiKeyToTest) {
        return NextResponse.json({
          ok: false,
          error: 'কোনো Gemini API Key প্রদান করা হয়নি! অনুগ্রহ করে একটি ভ্যালিড API Key ইনপুট দিন।',
        }, { status: 400 });
      }

      const model = body.model || 'gemini-1.5-flash';
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyToTest}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Hello Gemini! Reply with: "CONNECTED_OK"' }] }],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'CONNECTED_OK';
          return NextResponse.json({
            ok: true,
            message: `🎉 Gemini API (${model}) সফলভাবে কানেক্ট হয়েছে!`,
            reply,
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json({
            ok: false,
            error: errData?.error?.message || `Google API Error: HTTP ${res.status}`,
          }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({
          ok: false,
          error: `Gemini API কানেকশন টাইমআউট বা নেটওয়ার্ক এরর: ${err.message}`,
        }, { status: 500 });
      }
    }

    const current = readAiConfig();
    const updated: AiSupportConfig = {
      systemPrompt: body.systemPrompt !== undefined ? body.systemPrompt : current.systemPrompt,
      autoVerifyPayments:
        body.autoVerifyPayments !== undefined ? Boolean(body.autoVerifyPayments) : current.autoVerifyPayments,
      autoReplyDelayMs:
        body.autoReplyDelayMs !== undefined ? Number(body.autoReplyDelayMs) : current.autoReplyDelayMs,
      geminiApiKey: body.geminiApiKey !== undefined ? body.geminiApiKey : current.geminiApiKey,
      geminiModel: body.geminiModel !== undefined ? body.geminiModel : current.geminiModel,
      customRules: Array.isArray(body.customRules) ? body.customRules : current.customRules,
    };
    saveAiConfig(updated);
    return NextResponse.json({ ok: true, config: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

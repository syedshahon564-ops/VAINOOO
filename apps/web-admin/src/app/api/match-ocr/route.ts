import { NextRequest, NextResponse } from 'next/server';
import { parseScoreboardText } from '@/lib/ocr-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, rawText, match, registeredPlayers } = body;

    if (!match) {
      return NextResponse.json({ error: 'Match data is required' }, { status: 400 });
    }

    let extractedText = rawText || '';

    // If Gemini API Key or Cloud Vision is configured, attempt advanced multimodal OCR
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && imageBase64 && !extractedText) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: 'Extract the Free Fire scoreboard table from this screenshot. Return each player row as: #<Rank> <Player IGN> <Kills> Kills. Example:\n#1 OP_NINJA 7 Kills\n#2 BDX_STRIKER 4 Kills\nDo not include commentary.',
                    },
                    {
                      inlineData: {
                        mimeType: 'image/jpeg',
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const textCandidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textCandidate) {
            extractedText = textCandidate;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini OCR fallback to local parser:', geminiErr);
      }
    }

    // Parse the extracted or provided text using fuzzy matching against registered players
    const parsedRows = parseScoreboardText(extractedText, match, registeredPlayers || []);

    return NextResponse.json({
      success: true,
      extractedText,
      results: parsedRows,
      matchedCount: parsedRows.filter((r) => r.isMatched).length,
      totalCount: parsedRows.length,
    });
  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'OCR processing failed' },
      { status: 500 }
    );
  }
}

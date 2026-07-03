import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * POST /api/voice/token
 *
 * Generates an ephemeral token for Gemini Live API using the official
 * @google/genai SDK. The ephemeral token is short-lived and allows the
 * browser to open a direct WebSocket connection to Gemini's Live API
 * without exposing the real API key to the client.
 *
 * Response:
 *   { token: string }
 *   - token: the ephemeral token string (token.name from Google API)
 *            e.g. "AKLz...", used directly in WebSocket URL
 */
export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured on server" },
      { status: 500 }
    );
  }

  try {
    const client = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
    const newSessionExpireTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min to start

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
      },
    });

    // token.name is the actual ephemeral token string
    if (!token.name) {
      console.error("[voice/token] No token.name in response:", JSON.stringify(token));
      return NextResponse.json(
        { error: "Token generation returned empty token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: token.name });
  } catch (err) {
    console.error("[voice/token] Failed:", err);
    return NextResponse.json(
      { error: `Token error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

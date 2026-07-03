import { NextResponse } from "next/server";

/**
 * POST /api/voice/token
 *
 * Generates an ephemeral token for Gemini Live API using the server-side
 * GEMINI_API_KEY. The ephemeral token is short-lived (1 min to start a session,
 * 30 min per session) and is used by the browser to open a direct WebSocket
 * connection to Gemini, avoiding exposing the real API key to the client.
 *
 * Ephemeral token API:
 *   POST https://generativelanguage.googleapis.com/v1alpha/authTokens:create
 *   Headers: x-goog-api-key: <real_key>, Content-Type: application/json
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
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1alpha/authTokens:create",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[voice/token] Google API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Token service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[voice/token] Fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to generate ephemeral token" },
      { status: 500 }
    );
  }
}

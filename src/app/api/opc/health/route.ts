import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Health check công khai cho uptime monitor của OPC Center. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "opc-center",
    host: "opc.nooi.net",
    time: new Date().toISOString(),
  });
}

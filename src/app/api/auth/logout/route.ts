import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://app-api.sabturno.com";

export async function POST() {
  const session = await getSession();

  if (session) {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({ userId: session.user.id }),
    }).catch(console.error);
  }

  await destroySession();

  return NextResponse.json({ success: true });
}

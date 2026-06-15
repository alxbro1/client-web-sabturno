import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://app-api.sabturno.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

    await createSession({
      token: data.token,
      user: data.user,
    });

    return NextResponse.json({ user: data.user, token: data.token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

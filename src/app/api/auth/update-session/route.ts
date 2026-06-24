import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();

    const updatedUser = { ...session.user, ...body };

    await createSession({
      token: session.token,
      user: updatedUser,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

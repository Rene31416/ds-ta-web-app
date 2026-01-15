import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

// Sends Google OAuth code to backend with Auth0 token.
export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ message: "Missing session." }, { status: 401 });
    }

    const { token } = await auth0.getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const body = (await req.json()) as { code?: string };

    const res = await fetch(`${backendBase}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code: body.code }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to connect Google." },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Unable to reach the backend." },
      { status: 500 },
    );
  }
}

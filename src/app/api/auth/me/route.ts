import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ message: "Missing session." }, { status: 401 });
    }

    const { token } = await auth0.getAccessToken();
    if (!token) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const res = await fetch(`${backendBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to validate session." },
        { status: res.status },
      );
    }

    return NextResponse.json({ user: session.user, profile: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Unable to reach the backend." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

// Reads Auth0 session and returns a token for backend calls.
const getToken = async () => {
  const session = await auth0.getSession();
  if (!session) {
    return null;
  }
  const { token } = await auth0.getAccessToken();
  return token ?? null;
};

export async function GET() {
  try {
    const accessToken = await getToken();
    if (!accessToken) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const res = await fetch(`${backendBase}/reservations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to fetch bookings." },
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

export async function POST(request: Request) {
  try {
    const accessToken = await getToken();
    if (!accessToken) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const body = await request.json();
    const res = await fetch(`${backendBase}/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to create booking." },
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

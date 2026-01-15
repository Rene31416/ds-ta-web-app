import { NextResponse } from "next/server";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

const getAuthHeader = (request: Request) =>
  request.headers.get("authorization") ?? "";

export async function GET(request: Request) {
  try {
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const res = await fetch(`${backendBase}/reservations`, {
      headers: { Authorization: authHeader },
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
    const authHeader = getAuthHeader(request);
    if (!authHeader) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const body = await request.json();
    const res = await fetch(`${backendBase}/reservations`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
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

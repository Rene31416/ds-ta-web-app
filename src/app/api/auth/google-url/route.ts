import { NextResponse } from "next/server";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

// Gets Google OAuth URL from backend.
export async function GET() {
  try {
    const res = await fetch(`${backendBase}/auth/google/url`, {
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to fetch Google URL." },
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

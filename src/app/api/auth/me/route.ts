import { NextResponse } from "next/server";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const res = await fetch(`${backendBase}/auth/me`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to validate session." },
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

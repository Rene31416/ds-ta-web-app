import { NextResponse } from "next/server";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string };

    const res = await fetch(`${backendBase}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: body.code }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to sign in." },
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

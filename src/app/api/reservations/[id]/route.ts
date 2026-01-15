import { NextResponse } from "next/server";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const resolvedParams = await params;
    const res = await fetch(`${backendBase}/reservations/${resolvedParams.id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(
        { message: data?.message ?? "Failed to delete booking." },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Unable to reach the backend." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    if (!authHeader) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const res = await fetch(`${backendBase}/reservations/${resolvedParams.id}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Failed to update booking." },
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

import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const backendBase = process.env.BACKEND_URL ?? "http://localhost:3000";

const getToken = async () => {
  const session = await auth0.getSession();
  if (!session) {
    return null;
  }
  const { token } = await auth0.getAccessToken();
  return token ?? null;
};

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessToken = await getToken();
    if (!accessToken) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const resolvedParams = await params;
    const res = await fetch(`${backendBase}/reservations/${resolvedParams.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
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
    const accessToken = await getToken();
    if (!accessToken) {
      return NextResponse.json({ message: "Missing token." }, { status: 401 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const res = await fetch(`${backendBase}/reservations/${resolvedParams.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

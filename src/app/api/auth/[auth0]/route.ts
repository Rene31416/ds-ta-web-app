import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// Auth0 SDK route handler (login, logout, callback).
export async function GET(request: NextRequest) {
  return auth0.middleware(request);
}

export async function POST(request: NextRequest) {
  return auth0.middleware(request);
}

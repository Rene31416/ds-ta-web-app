"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const GOOGLE_CONNECTED_KEY = "ds-ta-google-connected";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const hasRun = useRef(false);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Connecting Google Calendar...");

  // Exchanges the Google OAuth code for calendar access.
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = params.get("code");
    if (!code) {
      setStatus("error");
      setMessage("Google did not return a code.");
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = (await res.json()) as { ok?: boolean; message?: string };

        if (!res.ok || !data.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Unable to connect Google Calendar.",
          );
        }

        localStorage.setItem(GOOGLE_CONNECTED_KEY, "1");
        router.replace("/");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("We could not complete the Google connection.");
      }
    };

    run();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Google Calendar</h1>
        <p className="text-sm text-slate-600">{message}</p>
        {status === "error" ? (
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </button>
        ) : null}
      </main>
    </div>
  );
}

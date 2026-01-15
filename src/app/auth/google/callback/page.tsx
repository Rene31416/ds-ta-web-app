"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthSession = {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
};

const STORAGE_KEY = "ds-ta-auth";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const hasRun = useRef(false);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Processing sign-in...");

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

        const data = (await res.json()) as
          | AuthSession
          | { message?: string };

        if (!res.ok || !("accessToken" in data)) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Unable to authenticate.",
          );
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        router.replace("/");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("We could not complete the sign-in.");
      }
    };

    run();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Authentication</h1>
        <p className="text-sm text-slate-600">{message}</p>
        {status === "error" ? (
          <button
            onClick={() => router.push("/")}
            className="mt-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to home
          </button>
        ) : null}
      </main>
    </div>
  );
}

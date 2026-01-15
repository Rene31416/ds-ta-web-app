import { Suspense } from "react";
import GoogleCallbackClient from "./ui";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
          <main className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold">Google Calendar</h1>
            <p className="text-sm text-slate-600">Loading...</p>
          </main>
        </div>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";

type AuthSession = {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
};

type Reservation = {
  id: number;
  name: string;
  startAt: string;
  endAt: string;
  createdAt?: string;
  updatedAt?: string;
};

const STORAGE_KEY = "ds-ta-auth";
const readSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
};

const toLocalDateTimeInput = (value: string) => {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
};

export default function Home() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [authStatus, setAuthStatus] = useState<
    "idle" | "checking" | "ok" | "expired" | "error"
  >("idle");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const formatReservationError = (message: string) => {
    if (message.includes("Google Calendar")) {
      return "A Google Calendar event conflicts with this time.";
    }
    if (message.includes("existing reservation")) {
      return "A booking already exists for this time.";
    }
    if (message.includes("startAt must be before endAt")) {
      return "Start time must be before end time.";
    }
    return "Unable to create the booking.";
  };

  useEffect(() => {
    setSession(readSession());
  }, []);

  useEffect(() => {
    if (!session) {
      setAuthStatus("idle");
      setAuthMessage(null);
      return;
    }

    const payload = decodeJwtPayload(session.accessToken);
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      clearSession();
      setSession(null);
      setAuthStatus("expired");
      setAuthMessage("Your session expired. Please sign in again.");
      return;
    }

    const validateSession = async () => {
      setAuthStatus("checking");
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        if (!res.ok) {
          throw new Error("Invalid session.");
        }
        setAuthStatus("ok");
        setAuthMessage(null);
      } catch (error) {
        console.error(error);
        clearSession();
        setSession(null);
        setAuthStatus("error");
        setAuthMessage("We could not validate your session.");
      }
    };

    validateSession();
  }, [session]);

  useEffect(() => {
    if (!session) {
      setReservations([]);
      return;
    }

    const loadReservations = async () => {
      setIsLoadingReservations(true);
      try {
        const res = await fetch("/api/reservations", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const data = (await res.json()) as Reservation[];
        if (!res.ok) {
          throw new Error("Unable to load bookings.");
        }
        setReservations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingReservations(false);
      }
    };

    loadReservations();
  }, [session]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/google-url");
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.message || "Unable to start login.");
      }
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert("Unable to start Google login.");
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  const handleCreateReservation = async () => {
    if (!session) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!startAt || !endAt) {
      setFormError("Select start and end date/time.");
      return;
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFormError("Invalid dates.");
      return;
    }
    if (start >= end) {
      setFormError("End time must be after start time.");
      return;
    }

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          startAt: start.toISOString(),
          endAt: end.toISOString(),
        }),
      });
      const data = (await res.json()) as Reservation & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Unable to create the booking.");
      }
      setReservations((prev) => [data, ...prev]);
      setName("");
      setStartAt("");
      setEndAt("");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? formatReservationError(error.message) : null;
      setFormError(message ?? "Unable to create the booking.");
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Unable to delete.");
      }
      setReservations((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Unable to delete the booking.");
    }
  };

  const startEditing = (item: Reservation) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditStartAt(toLocalDateTimeInput(item.startAt));
    setEditEndAt(toLocalDateTimeInput(item.endAt));
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditStartAt("");
    setEditEndAt("");
    setEditError(null);
  };

  const handleUpdateReservation = async () => {
    if (!session || editingId === null) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError("Name is required.");
      return;
    }
    if (!editStartAt || !editEndAt) {
      setEditError("Select start and end date/time.");
      return;
    }

    const start = new Date(editStartAt);
    const end = new Date(editEndAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setEditError("Invalid dates.");
      return;
    }
    if (start >= end) {
      setEditError("End time must be after start time.");
      return;
    }

    try {
      const res = await fetch(`/api/reservations/${editingId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          startAt: start.toISOString(),
          endAt: end.toISOString(),
        }),
      });
      const data = (await res.json()) as Reservation & { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Unable to update the booking.");
      }
      setReservations((prev) =>
        prev.map((item) => (item.id === data.id ? data : item)),
      );
      cancelEditing();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? formatReservationError(error.message) : null;
      setEditError(message ?? "Unable to update the booking.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Reservations
          </p>
          <h1 className="text-3xl font-semibold leading-tight">
            Booking dashboard
          </h1>
          <p className="text-base text-slate-600">
            Manage bookings and sync with your Google Calendar.
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Designly test
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {session ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Signed in user</p>
                <p className="text-lg font-semibold">{session.user.email}</p>
                <p className="text-sm text-slate-600">
                  {session.user.name || "No name"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p>
                  Session status:{" "}
                  {authStatus === "checking"
                    ? "checking..."
                    : authStatus === "ok"
                      ? "active"
                      : authStatus === "expired"
                        ? "expired"
                        : authStatus === "error"
                          ? "error"
                          : "unknown"}
                </p>
                <p>Google Calendar: authorized</p>
                {authMessage ? <p>{authMessage}</p> : null}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Connect your account to continue.
              </p>
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Opening Google..." : "Connect with Google"}
              </button>
            </div>
          )}
        </section>

        {session ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Create booking</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-600">
                  Name
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Client meeting"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  Start
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  End
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(event) => setEndAt(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              {formError ? (
                <p className="text-sm text-rose-600">{formError}</p>
              ) : null}
              <button
                onClick={handleCreateReservation}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save booking
              </button>
            </div>
          </section>
        ) : null}

        {session ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My bookings</h2>
              {isLoadingReservations ? (
                <span className="text-xs text-slate-500">Loading...</span>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {reservations.length === 0 && !isLoadingReservations ? (
                <p className="text-sm text-slate-600">
                  No bookings yet.
                </p>
              ) : null}
              {reservations.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingId === item.id ? (
                    <div className="w-full space-y-2">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                          placeholder="Booking name"
                        />
                        <input
                          type="datetime-local"
                          value={editStartAt}
                          onChange={(event) => setEditStartAt(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        />
                        <input
                          type="datetime-local"
                          value={editEndAt}
                          onChange={(event) => setEditEndAt(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                        />
                      </div>
                      {editError ? (
                        <p className="text-xs text-rose-600">{editError}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleUpdateReservation}
                          className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p>
                          {new Date(item.startAt).toLocaleString()} -{" "}
                          {new Date(item.endAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReservation(item.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 text-xs uppercase tracking-[0.3em] text-slate-400">
          Designly test
        </section>
      </main>
    </div>
  );
}

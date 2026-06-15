"use client";

import type { Activity, Participant } from "@/lib/growthHacking";

export type Session = { email: string; code: string; name: string };

const KEY = "gh_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}

type ApiResult = {
  ok: boolean;
  error?: string;
  name?: string;
  activities?: Activity[];
  participants?: Participant[];
  locked?: boolean;
  navn?: string;
  fasit?: number;
  mittSvar?: number | null;
};

export async function gh(
  action: "login" | "activities" | "participants" | "submit",
  payload: Record<string, unknown>
): Promise<ApiResult> {
  const res = await fetch("/api/growthHacking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return (await res.json()) as ApiResult;
}

export type { Activity, Participant };

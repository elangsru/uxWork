const url = process.env.GH_APPS_SCRIPT_URL;
const secret = process.env.GH_SHARED_SECRET;

export type Activity = {
  rad: number;
  navn: string;
  locked: boolean;
  harSvart: boolean;
  mittSvar: number | null;
};

export type Participant = {
  navn: string;
  harSvart: boolean;
  isMe: boolean;
  verdi?: number | null;
  avstand?: number | null;
};

export type GhAction = "login" | "activities" | "participants" | "submit";

export type GhResponse = {
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

/** Server-side call to the Apps Script web app, injecting the shared secret. */
export async function callAppsScript(
  action: GhAction,
  payload: Record<string, unknown>
): Promise<GhResponse> {
  if (!url || !secret) {
    return { ok: false, error: "missing_env" };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action, ...payload }),
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }

  if (!res.ok) {
    return { ok: false, error: `upstream_${res.status}` };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { ok: false, error: "upstream_non_json" };
  }

  try {
    return (await res.json()) as GhResponse;
  } catch {
    return { ok: false, error: "upstream_bad_json" };
  }
}

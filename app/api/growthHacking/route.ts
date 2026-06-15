import { NextResponse } from "next/server";
import { callAppsScript, type GhAction } from "@/lib/growthHacking";

const allowed: GhAction[] = ["login", "activities", "participants", "submit"];

export async function POST(req: Request) {
  let body: { action?: string; [key: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const { action, ...payload } = body;
  if (!action || !allowed.includes(action as GhAction)) {
    return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
  }

  const result = await callAppsScript(action as GhAction, payload);
  return NextResponse.json(result);
}

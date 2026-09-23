"use server";

import { revalidatePath } from "next/cache";
import { createEntry, getTeamSession, setDisplayName } from "@/lib/journal";
import { safeNext } from "@/lib/safe-next";
import { createSupabaseServerClient, requestOrigin } from "@/lib/supabase/server";

export type TeamLoginState = { message: string | null; error: string | null };

export async function sendTeamMagicLinkAction(_prev: TeamLoginState, formData: FormData): Promise<TeamLoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = safeNext(formData.get("next"), "/journal");
  if (!email) return { message: null, error: "이메일을 입력해 주세요." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { message: null, error: "기록 기능 비활성 — Supabase 설정이 필요합니다." };

  const siteUrl = await requestOrigin();
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  return { message: "등록된 팀원이면 로그인 링크를 보냈습니다. 메일함을 확인해 주세요.", error: null };
}

export type EntryState = {
  status: "idle" | "saved" | "error" | "invalid" | "forbidden" | "unauthorized" | "unconfigured" | "upload_failed" | "needs_display_name" | "duplicate";
  message: string | null;
};

export type DisplayNameState = { status: "idle" | "saved" | "error"; message: string | null };

export async function setDisplayNameAction(_prev: DisplayNameState, formData: FormData): Promise<DisplayNameState> {
  const session = await getTeamSession();
  const result = await setDisplayName(session, formData.get("displayName"));
  if (!result.ok) return { status: "error", message: result.message };
  const dayId = formData.get("dayId");
  if (typeof dayId === "string" && dayId) revalidatePath(`/journal/${dayId}`);
  return { status: "saved", message: `표시명을 '${result.value}'(으)로 설정했습니다.` };
}

export async function createEntryAction(_prev: EntryState, formData: FormData): Promise<EntryState> {
  const dayId = formData.get("dayId");
  const text = formData.get("text");
  const raw = formData.get("photo");
  const photo = raw instanceof File && raw.size > 0 ? raw : null;
  const result = await createEntry({ dayId, text, photo });
  if (result.ok) {
    if (typeof dayId === "string") revalidatePath(`/journal/${dayId}`);
    return { status: "saved", message: "기록이 저장되었습니다." };
  }
  return { status: result.reason, message: result.message };
}

"use server";

import { canEdit } from "@/lib/bookings/admin";
import { getAdminEmail } from "@/lib/supabase/env";
import { createSupabaseServerClient, requestOrigin } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export type MagicLinkState = { message: string | null; error: string | null };

export async function sendMagicLinkAction(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!email) return { message: null, error: "이메일을 입력해 주세요." };

  const supabase = await createSupabaseServerClient();
  const adminEmail = getAdminEmail();
  if (!supabase || !adminEmail) return { message: null, error: "편집 비활성 — Supabase·ADMIN_EMAIL 설정이 필요합니다." };

  const generic = { message: "허용된 이메일이면 로그인 링크를 보냈습니다. 메일함을 확인해 주세요.", error: null };
  if (!canEdit(email, adminEmail)) return generic;

  const siteUrl = await requestOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { message: null, error: `로그인 링크 발송 실패: ${error.message}` };
  return generic;
}

import type { Metadata } from "next";
import { TeamLoginForm } from "@/components/journal/TeamLoginForm";
import { StatusNote } from "@/components/ui/StatusNote";
import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "팀원 로그인 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function JournalLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/journal");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">팀원 로그인</h1>
      {sp.error === "auth" ? (
        <StatusNote tone="error" title="로그인 링크가 유효하지 않습니다">
          링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요. 다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.
        </StatusNote>
      ) : null}
      {isSupabaseConfigured() ? (
        <TeamLoginForm next={next} />
      ) : (
        <StatusNote tone="warn" title="기록 기능 비활성 — Supabase 설정이 필요합니다" />
      )}
    </div>
  );
}

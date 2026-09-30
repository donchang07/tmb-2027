import type { Metadata } from "next";
import { TeamLoginForm } from "@/components/journal/TeamLoginForm";
import { Photo } from "@/components/ui/Photo";
import { StatusNote } from "@/components/ui/StatusNote";
import { PHOTOS } from "@/lib/photos";
import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "팀원 로그인 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function JournalLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/journal");
  return (
    <div className="grid gap-3.5 lg:grid-cols-[448px_minmax(0,1fr)] lg:items-stretch lg:gap-10">
      <div className="mx-auto flex w-full max-w-[448px] min-w-0 flex-col justify-center gap-3.5 sm:gap-[18px] lg:mx-0">
        <h1 data-enter="1" className="text-[30px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[44px]">
          팀원 로그인
        </h1>
        {sp.error === "auth" ? (
          <div data-enter="2">
            <StatusNote tone="error" title="로그인 링크가 유효하지 않습니다">
              링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요. 다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.
            </StatusNote>
          </div>
        ) : null}
        {isSupabaseConfigured() ? (
          <TeamLoginForm next={next} />
        ) : (
          <StatusNote tone="warn" title="기록 기능 비활성 — Supabase 설정이 필요합니다" />
        )}
      </div>
      <Photo
        src={PHOTOS.teamLogin}
        className="order-first mx-auto h-[180px] w-full max-w-[448px] sm:h-[240px] lg:order-none lg:mx-0 lg:h-auto lg:min-h-[460px] lg:max-w-none"
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getAdminSession, isLeaderRegistered } from "@/lib/bookings/admin";
import { StatusNote } from "@/components/ui/StatusNote";
import { MagicLinkForm } from "@/components/admin/MagicLinkForm";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "관리자 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/admin/bookings");
  const session = await getAdminSession();
  const registered = session.state === "admin" && session.email ? await isLeaderRegistered(session.email) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">관리자 예약</h1>
      {sp.error === "auth" ? (
        <StatusNote tone="error" title="로그인 링크가 유효하지 않습니다">
          링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요. 다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요.
        </StatusNote>
      ) : null}

      {session.state === "unconfigured" ? (
        <StatusNote tone="warn" title="편집 비활성 — Supabase 연결과 ADMIN_EMAIL 설정이 필요합니다">
          `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAIL`을 설정하고 `supabase/migrations`를 적용한 뒤, `team_members`에 리더 이메일을 등록하세요. 공개 화면은 “미예약” 기본값으로 동작합니다.
        </StatusNote>
      ) : null}

      {session.state === "anonymous" ? (
        <>
          <StatusNote tone="info" title="리더 로그인이 필요합니다">
            허용된 리더 이메일로 magic link를 보내 드립니다. 로그인 후 원래 화면으로 돌아갑니다.
          </StatusNote>
          <MagicLinkForm next={next} />
        </>
      ) : null}

      {session.state === "forbidden" ? (
        <StatusNote
          tone="error"
          title="이 정보에 접근할 수 없습니다"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
                공개 화면으로
              </Link>
              <SignOutButton />
            </div>
          }
        >
          {session.email} 계정은 리더 권한이 없습니다.
        </StatusNote>
      ) : null}

      {session.state === "admin" ? (
        <StatusNote
          tone="info"
          title={`리더로 로그인됨 · ${session.email}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/bookings" className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
                12박 예약 상태 편집
              </Link>
              <SignOutButton />
            </div>
          }
        >
          공개 화면에는 상태만 표시되고 예약번호·비공개 메모는 리더에게만 보입니다.
          {registered === false ? (
            <span className="mt-2 block font-semibold text-safety">
              DB `team_members`에 리더 이메일이 등록되지 않았습니다. 저장이 거부됩니다 — 마이그레이션 하단 주석의 insert 문을 실행하세요.
            </span>
          ) : null}
          {registered === true ? <span className="mt-2 block text-emerald-800">DB 리더 등록 확인됨.</span> : null}
        </StatusNote>
      ) : null}
    </div>
  );
}

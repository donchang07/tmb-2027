import Link from "next/link";
import type { MemberProfile } from "@/lib/journal";
import { StatusNote } from "@/components/ui/StatusNote";
import { SignOutButton } from "@/components/admin/SignOutButton";

export function JournalAccessNote({ profile, next }: { profile: MemberProfile; next: string }) {
  if (profile.state === "member") {
    return (
      <StatusNote tone="info" title={`${profile.displayName ?? "팀원"}님으로 로그인`} action={<SignOutButton />}>
        열람은 누구나 가능합니다. 기록 작성은 팀원 로그인(매직 링크) 후 가능합니다.
      </StatusNote>
    );
  }
  return (
    <>
      {profile.state === "unconfigured" ? (
        <StatusNote tone="warn" title="기록 기능 비활성 — Supabase 설정이 필요합니다">
          `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정과 `20260916000002_journal.sql`·`20260917000004_journal_public.sql` 적용 후 사용할 수
          있습니다.
        </StatusNote>
      ) : null}
      <StatusNote
        tone="info"
        title="열람은 누구나 가능합니다"
        action={
          profile.state === "unconfigured" ? undefined : (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/journal/login?next=${encodeURIComponent(next)}`}
                className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white"
              >
                팀원 로그인
              </Link>
              {profile.state === "guest" ? <SignOutButton /> : null}
            </div>
          )
        }
      >
        기록 작성은 팀원 로그인(매직 링크) 후 가능합니다.
        {profile.state === "guest" ? " 현재 계정은 팀원 목록에 없습니다 — 리더에게 등록을 요청하세요." : null}
      </StatusNote>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { StatusNote } from "@/components/ui/StatusNote";
import { redirectIfSignedIn, resolvePageNext } from "@/app/login/shared";

export const metadata: Metadata = { title: "로그인 — TMB 2027" };

type SearchParams = { next?: string; reason?: string; error?: string };

function withNext(path: string, next: string | null): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const next = await resolvePageNext(sp.next);
  await redirectIfSignedIn(next);

  const notice =
    sp.error === "auth"
      ? { tone: "error" as const, text: "로그인 링크가 유효하지 않습니다. 다시 시도해 주세요. 다른 기기에서 링크를 열었다면 이 기기에서 다시 요청해 주세요." }
      : sp.reason === "expired"
        ? { tone: "info" as const, text: "로그인 시간이 만료되었습니다. 다시 로그인해 주세요." }
        : next
          ? { tone: "info" as const, text: "로그인이 필요한 화면입니다. 로그인하면 보던 화면으로 돌아갑니다." }
          : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold">로그인</h1>
      {notice ? <StatusNote tone={notice.tone} title={notice.text} /> : null}
      <LoginForm next={next} />
      <div className="space-y-1 text-sm">
        <p>
          <Link href={withNext("/signup", next)} className="tap inline-flex items-center font-semibold text-alpine underline">
            계정이 없으신가요? 회원가입
          </Link>
        </p>
        <p className="flex flex-wrap gap-x-4">
          <Link href="/journal/login" className="tap inline-flex items-center text-rock underline">
            팀원 이메일 링크 로그인
          </Link>
          <Link href="/admin" className="tap inline-flex items-center text-rock underline">
            리더 로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

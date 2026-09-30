import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Photo } from "@/components/ui/Photo";
import { StatusNote } from "@/components/ui/StatusNote";
import { PHOTOS } from "@/lib/photos";
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
    <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_448px] lg:items-center lg:gap-14">
      <Photo src={PHOTOS.login} className="mx-auto h-[150px] w-full max-w-[448px] sm:h-[220px] lg:mx-0 lg:h-[600px] lg:max-w-none" />
      <div className="mx-auto flex w-full max-w-[448px] min-w-0 flex-col gap-3.5 sm:gap-[18px] lg:mx-0">
        <h1 data-enter="1" className="text-[32px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[44px]">
          로그인
        </h1>
        {notice ? (
          <div data-enter="2">
            <StatusNote tone={notice.tone} title={notice.text} />
          </div>
        ) : null}
        <div data-enter="3">
          <LoginForm next={next} />
        </div>
        <p data-enter="4" className="text-[15px]">
          <Link href={withNext("/signup", next)} className="tap ix-link inline-flex items-center font-semibold text-forest-700">
            계정이 없으신가요? 회원가입
          </Link>
        </p>
        <p data-enter="5" className="flex flex-col border-t border-line pt-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4">
          <Link href="/journal/login" className="tap ix-link inline-flex items-center text-forest-700">
            팀원 이메일 링크 로그인
          </Link>
          <Link href="/admin" className="tap ix-link inline-flex items-center text-forest-700">
            리더 로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

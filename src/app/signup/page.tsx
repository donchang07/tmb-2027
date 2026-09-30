import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";
import { redirectIfSignedIn, resolvePageNext } from "@/app/login/shared";

export const metadata: Metadata = { title: "회원가입 — TMB 2027" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = await resolvePageNext(sp.next);
  await redirectIfSignedIn(next);

  return (
    <div className="grid gap-4 lg:grid-cols-[448px_minmax(0,1fr)] lg:items-center lg:gap-14">
      <div className="mx-auto flex w-full max-w-[448px] min-w-0 flex-col gap-4 lg:mx-0">
        <h1 data-enter="1" className="text-[32px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[44px]">
          회원가입
        </h1>
        <p data-enter="2" className="text-[15px] leading-[1.6] text-ink-2">
          가입하면 준비물 체크가 계정에 저장되어 다른 기기에서도 이어집니다. 일정·예산 등 공개 화면은 가입 없이 볼 수 있습니다. 기록 작성과 예약 편집은 리더가 등록한 팀원·리더만 가능합니다.
        </p>
        <div data-enter="3">
          <SignupForm next={next} />
        </div>
        <p data-enter="4" className="text-[15px]">
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="tap ix-link inline-flex items-center font-semibold text-forest-700">
            이미 계정이 있으신가요? 로그인
          </Link>
        </p>
      </div>
      <Photo
        src={PHOTOS.signup}
        className="order-first mx-auto h-[150px] w-full max-w-[448px] sm:h-[220px] lg:order-none lg:mx-0 lg:h-[620px] lg:max-w-none"
      />
    </div>
  );
}

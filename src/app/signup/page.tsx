import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { redirectIfSignedIn, resolvePageNext } from "@/app/login/shared";

export const metadata: Metadata = { title: "회원가입 — TMB 2027" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = await resolvePageNext(sp.next);
  await redirectIfSignedIn(next);

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold">회원가입</h1>
      <p className="text-sm text-rock">
        가입하면 준비물 체크가 계정에 저장되어 다른 기기에서도 이어집니다. 일정·예산 등 공개 화면은 가입 없이 볼 수 있습니다. 기록 작성과 예약 편집은 리더가 등록한 팀원·리더만 가능합니다.
      </p>
      <SignupForm next={next} />
      <p className="text-sm">
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="tap inline-flex items-center font-semibold text-alpine underline">
          이미 계정이 있으신가요? 로그인
        </Link>
      </p>
    </div>
  );
}

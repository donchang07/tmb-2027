import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

export function Hero({ slogan, todayHref }: { slogan: string; todayHref?: string }) {
  return (
    <section className="flex flex-col-reverse gap-3.5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div className="flex flex-col justify-center gap-3.5 sm:gap-[22px]">
        <p className="self-start rounded-[12px] bg-sage-200 px-2.5 py-[5px] text-xs font-semibold text-forest-700 sm:px-3 sm:py-1.5 sm:text-[13px]">
          TMB 2027 · Tour du Mont-Blanc
        </p>
        <h1 data-enter="1" className="text-[44px] font-extrabold leading-none tracking-[-0.045em] sm:text-[60px] min-[1160px]:text-[76px]">
          {slogan}
        </h1>
        <p className="text-base leading-[1.55] text-ink-2 sm:max-w-[30ch] sm:text-[19px] sm:leading-[1.6]">
          레주슈에서 샤모니까지, 반시계 방향 12일 · 리프트 없이 전 구간 도보.
        </p>
        {todayHref ? (
          <Link href={todayHref} className="btn btn-accent hidden self-start px-6 py-3.5 text-base sm:inline-flex">
            오늘 구간 보기
          </Link>
        ) : null}
      </div>
      <Photo src={PHOTOS.hero} position="center 60%" className="h-[220px] sm:h-[340px] lg:h-[460px]" />
    </section>
  );
}

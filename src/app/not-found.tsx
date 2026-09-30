import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

export default function NotFound() {
  return (
    <div className="relative flex flex-col gap-4 lg:-mx-12 lg:-mt-10 lg:block lg:h-[560px]">
      <Photo src={PHOTOS.notFound} className="h-[300px] lg:absolute lg:inset-0 lg:h-auto lg:rounded-none" />
      <div aria-hidden="true" className="scrim-side hidden lg:block" />
      <div className="flex flex-col gap-4 lg:absolute lg:left-14 lg:top-1/2 lg:max-w-[520px] lg:-translate-y-1/2 lg:text-white">
        <p
          role="status"
          data-enter="1"
          className="self-start rounded-[12px] bg-warn-bg px-3 py-[7px] text-sm font-bold text-warn-fg lg:px-3.5 lg:py-2 lg:text-[15px]"
        >
          페이지를 찾을 수 없습니다
        </p>
        <h1 data-enter="2" className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] lg:text-[56px] lg:leading-[1.05] lg:tracking-[-0.04em]">
          길을 벗어났습니다.
        </h1>
        <p data-enter="3" className="text-base text-ink-2 lg:text-lg lg:text-white">
          주소를 다시 확인해 주세요.
        </p>
        <Link
          href="/"
          data-enter="4"
          className="tap btn w-full bg-forest-900 px-6 py-3.5 text-base font-bold text-bone sm:w-auto sm:self-start lg:bg-amber lg:text-amber-ink"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";

export const metadata: Metadata = { title: "오프라인 — TMB 2027" };

export default function OfflinePage() {
  return (
    <div className="grid gap-3.5 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-4">
      <div className="flex min-w-0 flex-col gap-3.5 sm:gap-[18px]">
        <p
          role="status"
          data-enter="1"
          className="self-start rounded-[12px] bg-warn-bg px-3 py-[7px] text-sm font-bold text-warn-fg sm:px-3.5 sm:py-2 sm:text-[15px]"
        >
          인터넷 연결 후 한 번 열어 주세요
        </p>
        <h1 data-enter="2" className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.035em] sm:text-[44px]">
          아직 이 기기에 저장되지 않은 화면입니다.
        </h1>
        <p data-enter="3" className="max-w-[46ch] text-base leading-[1.6] text-ink-2 sm:text-[17px] sm:leading-[1.65]">
          이 화면은 아직 기기에 저장되지 않았습니다. 온라인 상태에서 일정·Day 상세를 한 번 열면 이후 오프라인에서도 볼 수 있습니다.
        </p>
        <a href="/" data-enter="4" className="tap btn btn-primary w-full px-6 py-3.5 text-base font-bold sm:w-auto sm:self-start">
          다시 시도
        </a>
        <section data-enter="5" className="card flex flex-col gap-2.5 p-[18px] sm:mt-4 sm:gap-3 sm:p-[22px]" aria-labelledby="emg-heading">
          <h2 id="emg-heading" className="text-lg font-bold sm:text-[19px]">
            비상 정보
          </h2>
          <a href="tel:112" className="tap btn btn-danger w-full px-[22px] py-3.5 text-[17px] sm:w-auto sm:self-start">
            112 긴급 전화 (유럽 공통)
          </a>
          <p className="text-[13px] text-ink-2 sm:text-sm">숙박 연락 수단은 저장된 Day 상세 화면에서 확인하세요.</p>
        </section>
      </div>
      <Photo src={PHOTOS.offline} className="order-first h-[200px] sm:h-[280px] lg:order-none lg:h-[520px]" />
    </div>
  );
}

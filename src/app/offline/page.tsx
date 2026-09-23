import type { Metadata } from "next";
import { StatusNote } from "@/components/ui/StatusNote";

export const metadata: Metadata = { title: "오프라인 — TMB 2027" };

export default function OfflinePage() {
  return (
    <div className="space-y-4">
      <StatusNote
        tone="warn"
        title="인터넷 연결 후 한 번 열어 주세요"
        action={
          <a href="/" className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
            다시 시도
          </a>
        }
      >
        이 화면은 아직 기기에 저장되지 않았습니다. 온라인 상태에서 일정·Day 상세를 한 번 열면 이후 오프라인에서도 볼 수 있습니다.
      </StatusNote>
      <section className="card border-l-4 border-l-safety p-4" aria-labelledby="emg-heading">
        <h2 id="emg-heading" className="font-bold">
          비상 정보
        </h2>
        <a href="tel:112" className="tap mt-2 inline-flex items-center rounded-lg bg-safety px-3 font-bold text-white">
          112 긴급 전화 (유럽 공통)
        </a>
        <p className="mt-2 text-sm text-rock">숙박 연락 수단은 저장된 Day 상세 화면에서 확인하세요.</p>
      </section>
    </div>
  );
}

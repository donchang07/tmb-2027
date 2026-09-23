import type { Metadata } from "next";
import { RouteOverviewMap } from "@/components/map/RouteOverviewMap";
import { MapLegend } from "@/components/map/MapLegend";
import { StatusNote } from "@/components/ui/StatusNote";

export const metadata: Metadata = { title: "개요 지도 — TMB 2027" };

export default function MapPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">개요 지도</h1>
        <p className="text-sm text-rock">12개 Day · 주요 고개·숙박 위치 · 반시계 방향</p>
      </header>

      <StatusNote tone="info" title="정적 개요 지도">
        검증된 GPX를 확보하기 전까지는 지점 마커 기반 개요만 제공합니다. GPX 승인 후 상호작용 지도(MapLibre)로 교체할 예정입니다 (I-003).
      </StatusNote>

      <RouteOverviewMap />
      <MapLegend />

      <section className="card p-4" aria-labelledby="source-heading">
        <h2 id="source-heading" className="font-bold">
          출처·라이선스
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rock">
          <li>좌표: 공개 지명 좌표 근사값(±1 km), 표시 전용 [추정]</li>
          <li>고도·구간: `docs/PRD.md` 부록 C (기준일 2026-09-09), GPX ±10% 허용</li>
          <li>지도 기준일 2026-09-16 · 라이선스: 팀 자체 제작 SVG (외부 타일·이미지 미사용)</li>
          <li>
            타일 적용 시 OpenFreeMap 또는 MapTiler Free를 사용하고 출처를 표기합니다 [기본값] — 검증 GPX 확보 후 적용(I-003).
          </li>
          <li>실제 길 찾기는 공식 지도·GPX·현장 표지를 따릅니다.</li>
        </ul>
      </section>
    </div>
  );
}

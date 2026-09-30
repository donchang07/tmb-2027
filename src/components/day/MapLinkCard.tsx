import type { RoutePoint } from "@/lib/schema";
import { isValidTrailUrl, isValidWalkingMapUrl } from "@/lib/map-url";
import { gpxLabel, type GpxEntry } from "@/lib/gpx";

export function MapLinkCard({
  mapUrl,
  trailUrl,
  gpx,
  from,
  to,
}: {
  mapUrl: string | undefined;
  trailUrl?: string;
  gpx?: GpxEntry;
  from: RoutePoint | undefined;
  to: RoutePoint | undefined;
}) {
  const valid = mapUrl !== undefined && isValidWalkingMapUrl(mapUrl);
  const trailValid = trailUrl !== undefined && isValidTrailUrl(trailUrl);
  return (
    <div className="flex flex-col gap-2.5 sm:gap-3.5">
      <p className="text-sm sm:text-base">
        {from?.nameOriginal ?? "출발지 확인 필요"} → {to?.nameOriginal ?? "도착지 확인 필요"}
      </p>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        {valid ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary whitespace-normal text-center"
          >
            Google 지도로 걷기 경로 열기 ↗
          </a>
        ) : (
          <p className="self-center text-sm text-warn-fg">지도 링크 확인 필요</p>
        )}
        {trailValid ? (
          <a
            href={trailUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="trail-link"
            className="btn btn-outline whitespace-normal text-center"
          >
            산길 경로 열기 (GraphHopper) ↗
          </a>
        ) : null}
        {gpx ? (
          <a
            href={gpx.file}
            download={`tmb2027-day-${String(gpx.trekDayNumber).padStart(2, "0")}.gpx`}
            data-testid="gpx-download"
            className="btn btn-outline whitespace-normal text-center"
          >
            GPX 다운로드 ({gpxLabel(gpx)})
          </a>
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-ink-3 sm:text-[13px]">
        Google 걷기 경로는 도로 위주라 고개 구간에서 크게 우회할 수 있습니다. 산길 경로·GPX는 OpenStreetMap 등산로(© OpenStreetMap contributors,
        ODbL) 기준 참고용입니다. GPX는 휴대폰 지도 앱(Gaia·Komoot·OsmAnd 등)에 넣어 오프라인으로 쓸 수 있습니다. 실제 길 찾기는 공식 지도·현장
        표지를 따르고, 거리·시간은 위 지표를 기준으로 합니다.
      </p>
    </div>
  );
}

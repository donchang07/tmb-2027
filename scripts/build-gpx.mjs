// TMB 2027 — Day별 산길 GPX 생성 (day-detail Act-4)
// 데이터: OpenStreetMap(ODbL) 등산로를 BRouter hiking-mountain 프로파일로 라우팅. 경유지는 route-segments.ts의
// trailViaIds(없으면 중간 노드 전부)를 쓴다 — 산길 경로 링크(GraphHopper)와 동일한 지점 구성.
// 실행: npm run build:gpx  → public/gpx/tmb2027-day-NN.gpx + src/data/gpx-manifest.json
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");

const nodes = new Map();
for (const m of read("src/data/seed/route-nodes.ts").matchAll(
  /id: "([^"]+)", nameKo: "([^"]*)", nameOriginal: "([^"]+)", kind: "([^"]+)", lat: ([\d.]+), lon: ([\d.]+), altitudeM: ([\d.]+|null)/g,
)) {
  nodes.set(m[1], { id: m[1], nameOriginal: m[3], kind: m[4], lat: Number(m[5]), lon: Number(m[6]), altitudeM: m[7] === "null" ? null : Number(m[7]) });
}

const segments = [];
for (const m of read("src/data/seed/route-segments.ts").matchAll(/seg\((\d+), "(\d+)", \[([^\]]+)\](?:, \[([^\]]+)\])?\)/g)) {
  const ids = m[3].split(",").map((s) => s.trim().replace(/"/g, ""));
  const via = m[4] ? m[4].split(",").map((s) => s.trim().replace(/"/g, "")) : ids.slice(1, -1);
  segments.push({ day: Number(m[1]), dayId: `d2027-08-${m[2]}`, nodeIds: ids, points: [ids[0], ...via, ids[ids.length - 1]] });
}

const dayNames = new Map();
for (const m of read("src/data/seed/days.ts").matchAll(/trekDayNumber: (\d+),\s*nameKo: "([^"]+)",\s*nameOriginal: "([^"]+)"/g)) {
  dayNames.set(Number(m[1]), { nameKo: m[2], nameOriginal: m[3] });
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const outDir = path.join(root, "public", "gpx");
mkdirSync(outDir, { recursive: true });
const generatedAt = new Date().toISOString().slice(0, 10);
const manifest = [];

for (const seg of segments) {
  const pts = seg.points.map((id) => nodes.get(id));
  const lonlats = pts.map((n) => `${n.lon},${n.lat}`).join("|");
  const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=hiking-mountain&alternativeidx=0&format=gpx`;
  const res = await fetch(url, { headers: { "User-Agent": "tmb2027-gpx-builder (leader planning tool)" } });
  if (!res.ok) throw new Error(`Day ${seg.day}: BRouter ${res.status}`);
  const raw = await res.text();
  const stats = raw.match(/track-length = (\d+) filtered ascend = (\d+) plain-ascend = (-?\d+) .*?time=([^\s]+(?: [^\s]+)*?) -->/);
  const trkseg = raw.match(/<trkseg>[\s\S]*?<\/trkseg>/)?.[0];
  if (!trkseg) throw new Error(`Day ${seg.day}: no trkseg`);
  const trkptCount = (trkseg.match(/<trkpt/g) ?? []).length;
  const name = dayNames.get(seg.day);
  const title = `TMB 2027 Day ${seg.day} · ${name?.nameOriginal ?? seg.dayId}`;
  const wpts = seg.nodeIds
    .map((id) => nodes.get(id))
    .map(
      (n) =>
        `  <wpt lat="${n.lat}" lon="${n.lon}">${n.altitudeM !== null ? `<ele>${n.altitudeM}</ele>` : ""}<name>${esc(n.nameOriginal)}</name><type>${n.kind}</type></wpt>`,
    )
    .join("\n");
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="tmb2027 build-gpx (BRouter hiking-mountain)">
  <metadata>
    <name>${esc(title)}</name>
    <desc>${esc(`${name?.nameKo ?? ""} · 경유 ${seg.points.length}지점 · 참고용 산길 경로. 실제 길 찾기는 공식 지도·현장 표지 우선.`)}</desc>
    <copyright author="OpenStreetMap contributors"><license>https://www.openstreetmap.org/copyright</license></copyright>
    <link href="https://brouter.de/"><text>Routing: BRouter hiking-mountain</text></link>
    <time>${generatedAt}T00:00:00Z</time>
  </metadata>
${wpts}
  <trk>
    <name>${esc(title)}</name>
    ${trkseg}
  </trk>
</gpx>
`;
  const file = `tmb2027-day-${String(seg.day).padStart(2, "0")}.gpx`;
  writeFileSync(path.join(outDir, file), gpx, "utf8");
  const entry = {
    dayId: seg.dayId,
    trekDayNumber: seg.day,
    file: `/gpx/${file}`,
    lengthKm: stats ? Math.round(Number(stats[1]) / 100) / 10 : null,
    ascendM: stats ? Number(stats[2]) : null,
    trackPoints: trkptCount,
    viaNodeIds: seg.points,
    generatedAt,
    source: "OpenStreetMap (ODbL) · BRouter hiking-mountain",
  };
  manifest.push(entry);
  console.log(`Day ${seg.day}: ${entry.lengthKm} km, +${entry.ascendM} m, ${trkptCount} pts → ${file}`);
}

writeFileSync(path.join(root, "src", "data", "gpx-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`manifest: ${manifest.length} days`);

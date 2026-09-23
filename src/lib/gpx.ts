import { z } from "zod";
import manifest from "@/data/gpx-manifest.json";

// Design Ref: day-detail §8 — scripts/build-gpx.mjs 가 생성한 정적 GPX(OSM ODbL · BRouter hiking-mountain)의 색인
export const GpxEntrySchema = z.object({
  dayId: z.string().regex(/^d\d{4}-\d{2}-\d{2}$/),
  trekDayNumber: z.number().int().min(1).max(12),
  file: z.string().regex(/^\/gpx\/tmb2027-day-\d{2}\.gpx$/),
  lengthKm: z.number().positive().nullable(),
  ascendM: z.number().nonnegative().nullable(),
  trackPoints: z.number().int().positive(),
  viaNodeIds: z.array(z.string()).min(2),
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().min(1),
});
export type GpxEntry = z.infer<typeof GpxEntrySchema>;

let validated: GpxEntry[] | null = null;

export function getGpxManifest(): GpxEntry[] {
  if (!validated) validated = z.array(GpxEntrySchema).parse(manifest);
  return validated;
}

export function getGpxForDay(dayId: string): GpxEntry | undefined {
  return getGpxManifest().find((g) => g.dayId === dayId);
}

export function gpxLabel(entry: GpxEntry): string {
  const parts = [`Day ${entry.trekDayNumber}`];
  if (entry.lengthKm !== null) parts.push(`${entry.lengthKm.toFixed(1)} km`);
  if (entry.ascendM !== null) parts.push(`+${entry.ascendM.toLocaleString("ko-KR")} m`);
  return parts.join(" · ");
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession, listAdminRows, toPublicBooking } from "@/lib/bookings/admin";
import { getDay } from "@/lib/itinerary";
import { type EditorLodging } from "@/components/admin/BookingEditor";
import { LodgingTable, type LodgingTableRow } from "@/components/admin/LodgingTable";
import { PublicPreview } from "@/components/admin/PublicPreview";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { StatusNote } from "@/components/ui/StatusNote";

export const metadata: Metadata = { title: "예약 상태 편집 — TMB 2027" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const session = await getAdminSession();
  if (session.state !== "admin") redirect("/admin?next=/admin/bookings");

  const result = await listAdminRows();
  const rows: LodgingTableRow[] = result.rows.map(({ lodging, booking }) => {
    const day = getDay(lodging.dayId);
    return {
      lodging,
      booking,
      dayLabel: day?.trekDayNumber ? `Day ${day.trekDayNumber}` : "이동일",
      date: day?.date ?? lodging.dayId.slice(1),
    };
  });
  const lodgings: EditorLodging[] = rows.map((r) => ({ id: r.lodging.id, nameOriginal: r.lodging.nameOriginal, dayLabel: r.dayLabel }));
  const bookingRows = rows.map((r) => r.booking).filter((b): b is NonNullable<typeof b> => b !== null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">14박 예약·숙박 편집</h1>
          <p className="text-sm text-rock">리더 {session.email} · 상태·숙박 정보는 공개, 예약번호·메모는 비공개</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="tap inline-flex items-center rounded-lg border border-rock/40 px-4 text-sm font-semibold text-rock">
            관리자 홈
          </Link>
          <SignOutButton />
        </div>
      </header>

      {!result.ok ? (
        <StatusNote tone="error" title="예약 목록을 불러올 수 없습니다">
          {result.message ?? result.state}. 아래 폼은 초기값(미예약, v1)으로 표시됩니다.
        </StatusNote>
      ) : bookingRows.length === 0 ? (
        <StatusNote tone="warn" title="예약 행이 없습니다">
          마이그레이션 `20260917000003_lodgings.sql`이 14박 숙박과 예약 행을 만듭니다. 적용 여부와 RLS(리더 이메일 등록)를 확인하세요. 아래 폼은 초기값(미예약, v1)으로 표시됩니다.
        </StatusNote>
      ) : null}

      <section aria-labelledby="edit-heading" className="space-y-3">
        <h2 id="edit-heading" className="text-lg font-bold">
          14박 편집
        </h2>
        <LodgingTable rows={rows} lodgings={lodgings} />
      </section>

      <section aria-labelledby="preview-heading" className="space-y-3">
        <h2 id="preview-heading" className="text-lg font-bold">
          공개 미리보기
        </h2>
        <p className="text-sm text-rock">방문자에게는 아래 상태와 갱신 시각만 보입니다.</p>
        <PublicPreview lodgings={lodgings} bookings={bookingRows.map(toPublicBooking)} />
      </section>
    </div>
  );
}

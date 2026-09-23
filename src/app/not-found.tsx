import Link from "next/link";
import { StatusNote } from "@/components/ui/StatusNote";

export default function NotFound() {
  return (
    <StatusNote
      tone="warn"
      title="페이지를 찾을 수 없습니다"
      action={
        <Link href="/" className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white">
          홈으로
        </Link>
      }
    >
      주소를 다시 확인해 주세요.
    </StatusNote>
  );
}

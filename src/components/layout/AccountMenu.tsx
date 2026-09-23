"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { StatusNote } from "@/components/ui/StatusNote";
import { accountLabel } from "@/lib/auth-rules";
import { dismissExpired, getAuthClient, useAuthUser } from "@/lib/auth-client";

// Design Ref: §5.3.2 — SCR-018 NAV-012 계정 메뉴(EL-01~05)

const AUTH_PAGES = new Set(["/login", "/signup"]);

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function loginHref(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

export function AccountMenu() {
  const auth = useAuthUser();
  const pathname = usePathname();

  if (auth.status === "loading") return <div aria-hidden="true" className="skeleton h-11 w-24 shrink-0 rounded-lg" />;
  if (auth.status === "unconfigured") return null;
  if (auth.status === "user") return <UserMenu email={auth.email} />;

  const onAuthPage = AUTH_PAGES.has(pathname);
  return (
    <>
      <a
        href={onAuthPage ? "/login" : loginHref(pathname)}
        aria-current={onAuthPage ? "page" : undefined}
        onClick={(e) => {
          if (!onAuthPage) e.currentTarget.href = loginHref(currentPath());
        }}
        className="tap flex shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-alpine hover:text-alpine-dark"
      >
        로그인
      </a>
      {auth.expired ? (
        <div className="absolute inset-x-0 top-full px-4 pt-2">
          <div className="mx-auto max-w-3xl">
            <StatusNote
              tone="info"
              title="로그인 시간이 만료되었습니다. 다시 로그인하면 계정 데이터를 불러옵니다."
              action={
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/login?reason=expired&next=${encodeURIComponent(pathname)}`}
                    onClick={(e) => {
                      e.currentTarget.href = `/login?reason=expired&next=${encodeURIComponent(currentPath())}`;
                    }}
                    className="tap inline-flex items-center rounded-lg bg-alpine px-4 text-sm font-semibold text-white"
                  >
                    다시 로그인
                  </a>
                  <button
                    type="button"
                    onClick={dismissExpired}
                    className="tap inline-flex items-center rounded-lg border border-rock/40 px-4 text-sm font-semibold text-rock"
                  >
                    닫기
                  </button>
                </div>
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const roleChecked = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const checkRole = async () => {
    if (roleChecked.current) return;
    roleChecked.current = true;
    const client = getAuthClient();
    if (!client) return;
    try {
      const { data, error } = await client.from("team_members").select("role").eq("email", email.toLowerCase()).maybeSingle();
      if (!error && data && (data as { role?: unknown }).role === "leader") setIsLeader(true);
    } catch {
      setIsLeader(false);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "account-menu" : undefined}
        onClick={() => {
          setOpen((v) => !v);
          void checkRole();
        }}
        className="tap flex max-w-[11rem] items-center gap-1 rounded-lg border border-rock/30 px-3 text-sm font-semibold text-alpine"
      >
        <span aria-hidden="true">◉</span>
        <span className="sr-only">계정</span>
        <span className="truncate">{accountLabel(email)}</span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id="account-menu"
          role="menu"
          aria-label="계정 메뉴"
          className="card absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] space-y-1 border border-rock/20 bg-snow p-2 shadow-lg"
        >
          <p role="presentation" className="break-all px-3 py-2 text-sm text-rock">
            {email}
          </p>
          {isLeader ? (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className="tap flex items-center rounded-lg px-3 text-sm text-alpine hover:bg-alpine/5">
              관리자 화면
            </Link>
          ) : null}
          <SignOutButton menuItem className="tap flex w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-rock hover:bg-alpine/5 disabled:opacity-60" />
        </div>
      ) : null}
    </div>
  );
}

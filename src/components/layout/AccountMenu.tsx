"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isAdminViewerAction } from "@/app/admin/actions";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { accountLabel } from "@/lib/auth-rules";
import { dismissExpired, useAuthUser } from "@/lib/auth-client";

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

  if (auth.status === "loading") return <div aria-hidden="true" className="skeleton h-11 w-24 shrink-0 rounded-[12px]" />;
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
        className="btn btn-primary shrink-0 text-sm sm:text-[15px]"
      >
        로그인
      </a>
      {auth.expired ? (
        <div
          role="status"
          data-enter="1"
          className="absolute inset-x-0 top-full z-40 bg-warn-bg text-sm text-warn-fg"
        >
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[18px] py-3 sm:px-10">
            <p className="min-w-0 leading-normal">로그인 시간이 만료되었습니다. 다시 로그인하면 계정 데이터를 불러옵니다.</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/login?reason=expired&next=${encodeURIComponent(pathname)}`}
                onClick={(e) => {
                  e.currentTarget.href = `/login?reason=expired&next=${encodeURIComponent(currentPath())}`;
                }}
                className="btn btn-primary px-3.5 text-sm font-bold"
              >
                다시 로그인
              </a>
              <button type="button" onClick={dismissExpired} className="btn btn-outline border-warn-fg/40 px-3.5 text-sm text-warn-fg">
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
    try {
      setIsAdmin(await isAdminViewerAction());
    } catch {
      setIsAdmin(false);
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
        className="btn btn-white max-w-[12rem] border border-line px-3 py-2 text-[13px] sm:gap-2 sm:px-3.5 sm:text-[15px]"
      >
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px] items-center justify-center rounded-[50%] bg-sage-200 text-[11px] text-forest-700 sm:text-xs">
          {email.charAt(0).toUpperCase()}
        </span>
        <span className="sr-only">계정</span>
        <span className="truncate">{accountLabel(email)}</span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id="account-menu"
          role="menu"
          aria-label="계정 메뉴"
          data-pop
          className="card shadow-pop absolute right-0 top-full z-40 mt-1.5 flex w-[250px] max-w-[calc(100vw-2rem)] flex-col p-1.5 sm:w-[280px] sm:p-2"
        >
          <p role="presentation" className="break-all border-b border-bone p-3 text-sm font-bold text-forest-900 sm:px-3.5 sm:text-[15px]">
            {email}
          </p>
          {isAdmin ? (
            <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className="tap ix-row flex items-center whitespace-nowrap rounded-[9px] px-3 py-3.5 text-[15px] font-semibold text-forest-900 sm:px-3.5">
              관리자 화면
            </Link>
          ) : null}
          <SignOutButton menuItem className="tap ix-row flex w-full cursor-pointer items-center whitespace-nowrap rounded-[9px] px-3 py-3.5 text-left text-[15px] font-semibold text-danger-ink disabled:opacity-60 sm:px-3.5" />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Compass,
  UsersRound,
  Bell,
  Mail,
  LogOut,
  Camera,
  Menu,
  X,
  CalendarCheck,
  Images,
  Wallet,
} from "lucide-react";
import { vi } from "@/i18n/vi";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOP_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/bookings/schedule", label: "Lịch làm việc", icon: Compass },
] as const;

const NAV_GROUPS = [
  {
    title: "Khách hàng",
    icon: UsersRound,
    items: [
      { href: "/bookings", label: "Quản lý đặt lịch" },
      { href: "/albums", label: "Album ảnh" },
      { href: "/clients", label: "Data khách hàng" },
    ],
  },
  {
    title: "Profile",
    icon: Bell,
    items: [
      { href: "/settings", label: "Giao diện website" },
      { href: "/portfolio", label: "Album mẫu" },
    ],
  },
] as const;

const BOTTOM_ITEMS = [
  { href: "/finance", label: "Tài chính", icon: Mail },
] as const;

function ResolvedStudioName({
  promise,
  className,
}: {
  promise: Promise<string>;
  className: string;
}) {
  const name = use(promise);
  return <span className={className}>{name}</span>;
}

function StudioNameText({
  studioNamePromise,
  className,
}: {
  studioNamePromise: Promise<string>;
  className: string;
}) {
  return (
    <Suspense fallback={<span className={className}>{vi.common.appName}</span>}>
      <ResolvedStudioName promise={studioNamePromise} className={className} />
    </Suspense>
  );
}

export function AppShell({
  studioNamePromise,
  children,
}: {
  studioNamePromise: Promise<string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/bookings") {
      return (
        pathname === "/bookings" ||
        (pathname.startsWith("/bookings/") &&
          !pathname.startsWith("/bookings/schedule"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavSections = (onNavigate?: () => void) => (
    <div className="space-y-4">
      <div className="space-y-1">
        {TOP_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/85 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {NAV_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const groupHasActive = group.items.some((sub) => isActive(sub.href));
        return (
          <div key={group.title} className="space-y-1">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium select-none",
                groupHasActive ? "text-foreground font-semibold" : "text-foreground/85"
              )}
            >
              <GroupIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{group.title}</span>
            </div>

            <div className="space-y-1 pl-7">
              {group.items.map((sub) => {
                const active = isActive(sub.href);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                        : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="space-y-1">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground/85 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar cố định trên Laptop / Desktop (>= 1024px) */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Camera className="h-5 w-5" />
          </div>
          <StudioNameText
            studioNamePromise={studioNamePromise}
            className="truncate font-semibold tracking-tight"
          />
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {renderNavSections()}
        </nav>

        <div className="border-t p-3">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>{vi.common.logout}</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Header trên Điện thoại & iPad (< 1024px) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu điều hướng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground hover:bg-accent cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Camera className="h-4 w-4" />
          </div>
          <StudioNameText
            studioNamePromise={studioNamePromise}
            className="truncate font-semibold text-sm sm:text-base"
          />
        </div>

        <form action={logoutAction}>
          <Button type="submit" size="sm" variant="ghost" className="gap-1.5 px-2.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{vi.common.logout}</span>
          </Button>
        </form>
      </header>

      {/* Ngăn kéo Menu đầy đủ cho Điện thoại & iPad */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs lg:hidden"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-72 max-w-[82vw] flex-col bg-card shadow-2xl border-r"
          >
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Camera className="h-4 w-4" />
                </div>
                <StudioNameText
                  studioNamePromise={studioNamePromise}
                  className="truncate font-semibold text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {renderNavSections(() => setMobileMenuOpen(false))}
            </nav>

            <div className="border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{vi.common.logout}</span>
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 pb-22 md:pb-8">
        <div className="mx-auto max-w-6xl p-3.5 sm:p-5 lg:p-8">{children}</div>
      </main>

      {/* Thanh điều hướng nhanh dưới đáy trên Điện thoại (< 768px) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:hidden">
        {[
          { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
          { href: "/bookings", label: "Đặt lịch", icon: CalendarCheck },
          { href: "/albums", label: "Album ảnh", icon: Images },
          { href: "/finance", label: "Tài chính", icon: Wallet },
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-1 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-1 text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Menu className="h-4 w-4 shrink-0" />
          <span>Thêm</span>
        </button>
      </nav>
    </div>
  );
}
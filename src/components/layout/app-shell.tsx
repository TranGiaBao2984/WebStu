"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  FileText,
  Users,
  Images,
  Wallet,
  Settings,
  LogOut,
  Camera,
} from "lucide-react";
import { vi } from "@/i18n/vi";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: vi.nav.dashboard, icon: LayoutDashboard },
  { href: "/bookings", label: vi.nav.bookings, icon: CalendarCheck },
  { href: "/bookings/schedule", label: vi.nav.schedule, icon: CalendarDays },
  { href: "/bookings/documents", label: vi.nav.documents, icon: FileText },
  { href: "/clients", label: vi.nav.clients, icon: Users },
  { href: "/albums", label: vi.nav.albums, icon: Images },
  { href: "/finance", label: vi.nav.finance, icon: Wallet },
  { href: "/settings", label: vi.nav.settings, icon: Settings },
] as const;

export function AppShell({
  studioName,
  children,
}: {
  studioName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/bookings") {
      return (
        pathname === "/bookings" ||
        (pathname.startsWith("/bookings/") &&
          !pathname.startsWith("/bookings/schedule") &&
          !pathname.startsWith("/bookings/documents"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Camera className="h-5 w-5" />
          </div>
          <span className="truncate font-semibold tracking-tight">{studioName}</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
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

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Camera className="h-4 w-4" />
          </div>
          <span className="font-semibold">{studioName}</span>
        </div>
        <form action={logoutAction}>
          <Button type="submit" size="sm" variant="ghost">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </header>

      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card py-1.5 md:hidden">
        {[
          NAV_ITEMS[0],
          NAV_ITEMS[1],
          NAV_ITEMS[2],
          NAV_ITEMS[6],
          NAV_ITEMS[7],
        ].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

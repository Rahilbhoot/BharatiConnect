import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, Newspaper, Trophy, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { PortalSwitch } from "@/components/PortalSwitch";
import { LangThemeToggle } from "@/components/LangThemeToggle";
import { NotificationBell } from "@/components/staff/NotificationBell";
import { Celebration } from "@/components/Celebration";
import { DemoBadge } from "@/components/DemoBadge";

const tabs = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/reading", icon: BookOpen, key: "nav.reading" },
  { to: "/compete", icon: Trophy, key: "nav.compete" },
  { to: "/content", icon: Newspaper, key: "nav.content" },
  { to: "/profile", icon: UserIcon, key: "nav.profile" },
] as const;

export function StaffShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-soft/60 via-background to-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-primary">{t("app.name")}</p>
            <p className="truncate text-[11px] text-muted-foreground">{t("app.org")}</p>
          </div>
          <div className="flex items-center gap-1">
            <DemoBadge />
            <LangThemeToggle />
            <NotificationBell />
          </div>
        </div>
        <div className="mx-auto flex max-w-2xl justify-center px-4 pb-2">
          <PortalSwitch />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl">
          {tabs.map(({ to, icon: Icon, key }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-2xl transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {t(key)}
              </Link>
            );
          })}
        </div>
      </nav>

      <Celebration />
    </div>
  );
}

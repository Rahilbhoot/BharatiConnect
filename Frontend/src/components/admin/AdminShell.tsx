import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  FileText,
  Gauge,
  Image,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LangThemeToggle } from "@/components/LangThemeToggle";
import { PortalSwitch } from "@/components/PortalSwitch";
import { DemoBadge } from "@/components/DemoBadge";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", icon: Gauge, key: "admin.dashboard", exact: true },
  { to: "/admin/staff", icon: Users, key: "admin.staff" },
  { to: "/admin/departments", icon: Building2, key: "admin.departments" },
  { to: "/admin/analytics", icon: BookOpen, key: "admin.analytics" },
  { to: "/admin/proof", icon: Image, key: "admin.proof" },
  { to: "/admin/challenges", icon: Target, key: "admin.challenges" },
  { to: "/admin/badges", icon: BadgeCheck, key: "admin.badges" },
  { to: "/admin/content", icon: FileText, key: "admin.content" },
  { to: "/admin/holidays", icon: CalendarDays, key: "admin.holidays" },
  { to: "/admin/settings", icon: Settings, key: "admin.settings" },
  { to: "/admin/reports", icon: ScrollText, key: "admin.reports" },
  { to: "/admin/audit", icon: ScrollText, key: "admin.audit" },
  { to: "/admin/admins", icon: ShieldCheck, key: "admin.owners" },
] as const;

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { adminUser } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-brand-soft/40 via-background to-background">
      <aside
        className={cn(
          "no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl md:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex items-center gap-2 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{t("app.name")}</p>
              <p className="truncate text-[10px] text-muted-foreground">{t("nav.adminPortal")}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {items.map(({ to, icon: Icon, key }) => {
            const active = to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
                title={t(key)}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{t(key)}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-3">
          {!collapsed && <p className="truncate text-xs font-medium">{adminUser?.name}</p>}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start gap-2 text-xs"
            onClick={() => actions.adminLogout()}
          >
            <LogOut className="size-3.5" /> {!collapsed && t("auth.logout")}
          </Button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2">
            <DemoBadge />
            <PortalSwitch />
            <LangThemeToggle />
          </div>
        </header>
        <nav className="no-print flex gap-2 overflow-x-auto border-b border-border/60 px-4 py-2 md:hidden">
          {items.map(({ to, key }) => (
            <Link
              key={to}
              to={to}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs"
            >
              {t(key)}
            </Link>
          ))}
        </nav>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

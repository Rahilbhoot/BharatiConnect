import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function PortalSwitch({ className }: { className?: string }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className={cn("glass flex items-center gap-1 rounded-full p-1", className)}>
      <Link
        to="/"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          !isAdmin ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        )}
      >
        <Smartphone className="size-3.5" />
        {t("nav.staffApp")}
      </Link>
      <Link
        to="/admin"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
          isAdmin ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        )}
      >
        <LayoutDashboard className="size-3.5" />
        {t("nav.adminPortal")}
      </Link>
    </div>
  );
}

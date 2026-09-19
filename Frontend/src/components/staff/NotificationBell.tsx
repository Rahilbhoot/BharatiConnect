import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const { notifications } = useAppState();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("home.notifications")}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{t("home.notifications")}</SheetTitle>
          <SheetDescription>{t("app.org")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 overflow-y-auto px-4 pb-6">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => actions.markNotificationRead(n.id)}
              className={cn(
                "glass w-full rounded-2xl p-3 text-left",
                !n.read && "border-primary/40 bg-primary/5",
              )}
            >
              <p className="text-sm font-medium">{i18n.language === "mr" ? n.titleMr : n.titleEn}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {n.at} · {n.type.replace(/_/g, " ")}
              </p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

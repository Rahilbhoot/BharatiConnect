import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogOut, Mail, Phone, Users } from "lucide-react";
import { StaffShell } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { actions, useAppState } from "@/lib/store";
import { useNotifications, useStaffList } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — BharatiConnect" },
      {
        name: "description",
        content: "Switch between Marathi and English, set your reminder time and read notifications.",
      },
      { property: "og:title", content: "Profile — BharatiConnect" },
      {
        property: "og:description",
        content: "Language, reminders, theme and notifications for your BharatiConnect account.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { t, i18n } = useTranslation();
  const { sessionUser, departments, staff, language, theme, notifications } = useAppState();
  const { data: liveNotifications = notifications } = useNotifications();
  const { data: liveStaff = staff } = useStaffList();
  const dept = departments.find((d) => d.id === sessionUser?.departmentId);

  return (
    <StaffShell>
      <div className="space-y-5">
        <div className="glass flex items-center gap-4 rounded-3xl p-5">
          <span
            className="flex size-16 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ backgroundColor: sessionUser?.avatarColor }}
          >
            {sessionUser?.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{sessionUser?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t("profile.role")}: {sessionUser?.role} ·{" "}
              {i18n.language === "mr" ? dept?.nameMr : dept?.nameEn}
            </p>
          </div>
        </div>

        <div className="glass space-y-2 rounded-3xl p-5 text-sm">
          <p className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" /> {sessionUser?.email}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" /> {sessionUser?.phone}
          </p>
        </div>

        <div className="glass space-y-4 rounded-3xl p-5">
          <div className="space-y-2">
            <Label>{t("profile.languageSwitch")}</Label>
            <ToggleGroup
              type="single"
              value={language}
              variant="outline"
              onValueChange={(v) => v && actions.setLanguage(v as "en" | "mr")}
              className="w-full"
            >
              <ToggleGroupItem value="mr" className="flex-1 touch-target">
                मराठी
              </ToggleGroupItem>
              <ToggleGroupItem value="en" className="flex-1 touch-target">
                English
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder">{t("profile.reminderTime")}</Label>
            <Input
              id="reminder"
              type="time"
              className="h-12"
              value={sessionUser?.reminderTime ?? "07:30"}
              onChange={(e) => actions.setReminderTime(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="theme">{t("profile.theme")}</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {t("profile.light")}
              <Switch
                id="theme"
                checked={theme === "dark"}
                onCheckedChange={(c) => actions.setTheme(c ? "dark" : "light")}
              />
              {t("profile.dark")}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("profile.notificationList")}</p>
          {liveNotifications.map((n: any) => (
            <button
              key={n.id || n._id}
              onClick={() => actions.markNotificationRead(n.id || n._id)}
              className={cn(
                "glass w-full rounded-2xl p-3 text-left",
                !n.read && "border-primary/40 bg-primary/5",
              )}
            >
              <p className="text-sm font-medium">
                {n.title || (i18n.language === "mr" ? n.titleMr : n.titleEn)}
              </p>
              {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                {n.at || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "")}
              </p>
            </button>
          ))}
          {liveNotifications.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("common.none", "No notifications")}</p>
          )}
        </div>

        {/* Staff Directory (Staff-04) */}
        <div className="glass space-y-3 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Users className="size-4 text-primary" />
              <span>{t("profile.staffDirectory", "Staff Directory")}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {liveStaff.filter((s) => s.active).length} {t("profile.members", "members")}
            </span>
          </div>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {liveStaff
              .filter((s) => s.active)
              .map((member) => {
                const memberDept = departments.find((d) => d.id === member.departmentId);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl bg-muted/30 p-2.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                        style={{ backgroundColor: member.avatarColor || "#6366f1" }}
                      >
                        {member.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {i18n.language === "mr" ? memberDept?.nameMr : memberDept?.nameEn}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          title={member.phone}
                          className="rounded-lg p-1 hover:bg-muted hover:text-primary"
                        >
                          <Phone className="size-3.5" />
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          title={member.email}
                          className="rounded-lg p-1 hover:bg-muted hover:text-primary"
                        >
                          <Mail className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <Button asChild variant="outline" className="h-12 w-full gap-2">
          <Link to="/login" onClick={() => actions.logout()}>
            <LogOut className="size-4" /> {t("auth.logout")}
          </Link>
        </Button>
      </div>
    </StaffShell>
  );
}

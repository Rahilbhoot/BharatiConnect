import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminShell } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { actions, useAppState } from "@/lib/store";
import type { Language, ProofMode } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "System Settings — BharatiConnect Admin" },
      { name: "description", content: "Minimum pages, proof mode, freezes, reminders and default language." },
      { property: "og:title", content: "System Settings — BharatiConnect Admin" },
      { property: "og:description", content: "Tune the reading habit rules for your organization." },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const { t } = useTranslation();
  const { settings } = useAppState();

  return (
    <AdminShell title={t("admin.settings")}>
      <div className="glass grid max-w-3xl gap-5 rounded-3xl p-6">
        <div className="space-y-1.5">
          <Label>{t("admin.minimumPages")}</Label>
          <Input
            type="number"
            className="h-11"
            value={settings.minimumPages}
            onChange={(e) => actions.updateSettings({ minimumPages: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("admin.proofMode")}</Label>
          <Select
            value={settings.proofMode}
            onValueChange={(v) => actions.updateSettings({ proofMode: v as ProofMode })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">off</SelectItem>
              <SelectItem value="optional">optional</SelectItem>
              <SelectItem value="required">required</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("admin.freezes")}</Label>
          <Input
            type="number"
            className="h-11"
            value={settings.freezesPerWeek}
            onChange={(e) => actions.updateSettings({ freezesPerWeek: Number(e.target.value) })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{t("profile.reminderTime")}</Label>
            <Input
              type="time"
              className="h-11"
              value={settings.reminderTime}
              onChange={(e) => actions.updateSettings({ reminderTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.nudgeTime")}</Label>
            <Input
              type="time"
              className="h-11"
              value={settings.nudgeTime}
              onChange={(e) => actions.updateSettings({ nudgeTime: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label>
            {t("admin.spotCheck")}: {settings.spotCheckRate}%
          </Label>
          <Slider
            value={[settings.spotCheckRate]}
            max={100}
            step={5}
            onValueChange={([v]) => actions.updateSettings({ spotCheckRate: v ?? 0 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("admin.defaultLanguage")}</Label>
          <Select
            value={settings.defaultLanguage}
            onValueChange={(v) => actions.updateSettings({ defaultLanguage: v as Language })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">मराठी</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </AdminShell>
  );
}

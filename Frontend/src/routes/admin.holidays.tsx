import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useAppState } from "@/lib/store";
import type { HolidayType } from "@/lib/types";
import { iso } from "@/lib/demo-data";

export const Route = createFileRoute("/admin/holidays")({
  head: () => ({
    meta: [
      { title: "Holiday Calendar — BharatiConnect Admin" },
      { name: "description", content: "Organization holidays and individual staff leave markers." },
      { property: "og:title", content: "Holiday Calendar — BharatiConnect Admin" },
      { property: "og:description", content: "Mark holidays and leave so streaks stay fair." },
    ],
  }),
  component: Holidays,
});

function Holidays() {
  const { t, i18n } = useTranslation();
  const { holidays, staff } = useAppState();
  const [form, setForm] = useState({
    date: iso(new Date()),
    type: "holiday" as HolidayType,
    labelEn: "",
    labelMr: "",
    userId: "",
  });

  return (
    <AdminShell title={t("admin.holidays")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass space-y-3 rounded-3xl p-5">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              className="h-11"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as HolidayType })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holiday">holiday</SelectItem>
                <SelectItem value="leave">leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.type === "leave" && (
            <div className="space-y-1.5">
              <Label>Staff</Label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm({ ...form, userId: v })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t("admin.nameEn")}</Label>
            <Input
              className="h-11"
              value={form.labelEn}
              onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.nameMr")}</Label>
            <Input
              className="h-11"
              lang="mr"
              value={form.labelMr}
              onChange={(e) => setForm({ ...form, labelMr: e.target.value })}
            />
          </div>
          <Button
            className="h-11 w-full"
            disabled={!form.labelEn || !form.labelMr}
            onClick={() => {
              actions.addHoliday({
                date: form.date,
                type: form.type,
                labelEn: form.labelEn,
                labelMr: form.labelMr,
                ...(form.type === "leave" && form.userId ? { userId: form.userId } : {}),
              });
              setForm({ ...form, labelEn: "", labelMr: "", userId: "" });
            }}
          >
            {t("common.add")}
          </Button>
        </div>

        <div className="space-y-2 lg:col-span-2">
          {[...holidays]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((h) => (
              <div key={h.id} className="glass flex items-center gap-3 rounded-2xl p-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    h.type === "holiday" ? "bg-amber-500/20" : "bg-sky-500/20"
                  }`}
                >
                  {h.type}
                </span>
                <span className="text-sm font-medium">
                  {i18n.language === "mr" ? h.labelMr : h.labelEn}
                </span>
                {h.userId && (
                  <span className="text-xs text-muted-foreground">
                    {staff.find((s) => s.id === h.userId)?.name}
                  </span>
                )}
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">{h.date}</span>
                <Button size="icon" variant="ghost" onClick={() => actions.removeHoliday(h.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
        </div>
      </div>
    </AdminShell>
  );
}

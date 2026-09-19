import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useAppState } from "@/lib/store";
import type { ChallengeType } from "@/lib/types";
import { daysAgo, iso } from "@/lib/demo-data";

export const Route = createFileRoute("/admin/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — BharatiConnect Admin" },
      { name: "description", content: "Create and monitor individual and collective reading challenges." },
      { property: "og:title", content: "Challenges — BharatiConnect Admin" },
      { property: "og:description", content: "Reading challenge management for Akshar Bharati." },
    ],
  }),
  component: AdminChallenges,
});

function AdminChallenges() {
  const { t, i18n } = useTranslation();
  const { challenges } = useAppState();
  const [form, setForm] = useState({
    titleEn: "",
    titleMr: "",
    type: "individual_pages" as ChallengeType,
    target: "300",
    rewardPoints: "200",
    endsOn: iso(daysAgo(-30)),
  });

  return (
    <AdminShell title={t("admin.challenges")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass space-y-3 rounded-3xl p-5">
          <p className="text-sm font-semibold">{t("common.add")}</p>
          <div className="space-y-1.5">
            <Label>{t("admin.nameEn")}</Label>
            <Input
              className="h-11"
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.nameMr")}</Label>
            <Input
              className="h-11"
              lang="mr"
              value={form.titleMr}
              onChange={(e) => setForm({ ...form, titleMr: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as ChallengeType })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual_pages">individual_pages</SelectItem>
                <SelectItem value="individual_days">individual_days</SelectItem>
                <SelectItem value="collective_days">collective_days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("compete.target")}</Label>
              <Input
                type="number"
                className="h-11"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("compete.reward")}</Label>
              <Input
                type="number"
                className="h-11"
                value={form.rewardPoints}
                onChange={(e) => setForm({ ...form, rewardPoints: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ends on</Label>
            <Input
              type="date"
              className="h-11"
              value={form.endsOn}
              onChange={(e) => setForm({ ...form, endsOn: e.target.value })}
            />
          </div>
          <Button
            className="h-11 w-full"
            disabled={!form.titleEn || !form.titleMr}
            onClick={() =>
              actions.saveChallenge({
                titleEn: form.titleEn,
                titleMr: form.titleMr,
                type: form.type,
                target: Number(form.target),
                rewardPoints: Number(form.rewardPoints),
                endsOn: form.endsOn,
              })
            }
          >
            {t("common.save")}
          </Button>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {challenges.map((c) => (
            <div key={c.id} className="glass rounded-3xl p-5">
              <p className="font-medium">{i18n.language === "mr" ? c.titleMr : c.titleEn}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.type} · {t("compete.target")} {c.target} · +{c.rewardPoints}{" "}
                {t("common.points")} · {c.endsOn}
              </p>
              <Progress value={(c.progress / c.target) * 100} className="mt-3" />
              <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                {c.progress}/{c.target}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

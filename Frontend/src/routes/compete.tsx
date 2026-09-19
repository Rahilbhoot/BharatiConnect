import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Award, Lock, Medal, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StaffShell } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLeaderboard } from "@/lib/queries";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compete")({
  head: () => ({
    meta: [
      { title: "Compete — BharatiConnect" },
      {
        name: "description",
        content: "Department and individual leaderboards, reading challenges and badges.",
      },
      { property: "og:title", content: "Compete — BharatiConnect" },
      {
        property: "og:description",
        content: "Leaderboards, challenges and badges for Akshar Bharati staff.",
      },
    ],
  }),
  component: Compete,
});

const badgeIcon: Record<string, string> = {
  first_page: "📖",
  streak_7: "🔥",
  streak_30: "🏅",
  book_finisher: "🎯",
  early_bird: "🌅",
  marathi_reader: "🪔",
  comeback: "💪",
};

function Compete() {
  const { t, i18n } = useTranslation();
  const { challenges, badges, sessionUser } = useAppState();
  const [scope, setScope] = useState<"department" | "individual">("department");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const { data: rows = [] } = useLeaderboard(scope, period);

  return (
    <StaffShell>
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaderboard">{t("compete.leaderboard")}</TabsTrigger>
          <TabsTrigger value="challenges">{t("compete.challenges")}</TabsTrigger>
          <TabsTrigger value="badges">{t("compete.badges")}</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <ToggleGroup
              type="single"
              value={scope}
              onValueChange={(v) => v && setScope(v as typeof scope)}
              variant="outline"
            >
              <ToggleGroupItem value="department">{t("compete.department")}</ToggleGroupItem>
              <ToggleGroupItem value="individual">{t("compete.individual")}</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(v) => v && setPeriod(v as typeof period)}
              variant="outline"
            >
              <ToggleGroupItem value="weekly">{t("common.weekly")}</ToggleGroupItem>
              <ToggleGroupItem value="monthly">{t("common.monthly")}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            {rows.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "glass flex items-center gap-3 rounded-2xl p-3",
                  row.isCurrentUser && "border-primary bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                    i === 0
                      ? "bg-streak text-streak-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {row.label}
                  {row.isCurrentUser && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                      {t("compete.you")}
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold tabular-nums">{row.points}</span>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-3">
          {challenges.map((c) => (
            <div key={c.id} className="glass rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{i18n.language === "mr" ? c.titleMr : c.titleEn}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("compete.target")}: {c.target} · {t("compete.reward")}: +{c.rewardPoints}{" "}
                    {t("common.points")} · {c.endsOn}
                  </p>
                </div>
                <Medal className="size-5 shrink-0 text-streak" />
              </div>
              <Progress value={(c.progress / c.target) * 100} className="mt-4" />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {c.progress}/{c.target}
                </span>
                {c.joined ? (
                  <span className="text-xs font-semibold text-success-foreground dark:text-success">
                    {t("compete.joined")}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      actions.joinChallenge(c.id);
                      void confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
                    }}
                  >
                    {t("compete.join")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div className="glass flex items-center gap-4 rounded-3xl p-5">
            <Sparkles className="size-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t("home.level")}</p>
              <p className="text-2xl font-bold">{sessionUser?.level ?? 1}</p>
            </div>
            <Progress value={((sessionUser?.points ?? 0) % 500) / 5} className="flex-1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <motion.div
                key={b.id}
                whileHover={{ y: -4 }}
                className={cn(
                  "glass flex flex-col items-center gap-2 rounded-2xl p-4 text-center",
                  !b.earned && "opacity-50 grayscale",
                )}
              >
                <span className="text-3xl">{badgeIcon[b.key]}</span>
                <span className="text-[11px] font-medium leading-tight">{t(`badges.${b.key}`)}</span>
                {b.earned ? (
                  <Award className="size-3.5 text-success" />
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="size-3" /> {t("compete.locked")}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </StaffShell>
  );
}

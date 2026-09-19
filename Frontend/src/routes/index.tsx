import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CheckCircle2, ChevronRight, Circle, Flame, Sparkles, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StaffShell } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BharatiConnect — Daily reading for Akshar Bharati staff" },
      {
        name: "description",
        content:
          "Log your daily reading, keep your streak alive and follow Akshar Bharati notices in Marathi or English.",
      },
      { property: "og:title", content: "BharatiConnect — Daily reading for Akshar Bharati staff" },
      {
        property: "og:description",
        content: "Streaks, challenges, bookshelf and notices for Akshar Bharati staff.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, i18n } = useTranslation();
  const { sessionUser, todayLogged, challenges, books } = useAppState();
  const user = sessionUser;
  const challenge = challenges.find((c) => c.joined) ?? challenges[0]!;
  const readingNow = books.filter((b) => b.status === "reading");

  return (
    <StaffShell>
      <div className="space-y-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold">
            {t("home.greeting", { name: user?.name.split(" ")[0] ?? "" })}
          </h1>
          <p className="text-sm text-muted-foreground">{t("home.subtitle")}</p>
        </div>

        <div className="glass relative overflow-hidden rounded-3xl p-6 text-center">
          <div className="absolute -top-16 -right-10 size-40 rounded-full bg-streak/25 blur-3xl" />
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="relative flex items-center justify-center gap-3"
          >
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="text-5xl"
            >
              🔥
            </motion.span>
            <span className="text-6xl font-bold tabular-nums text-streak-foreground dark:text-streak">
              {user?.streak ?? 0}
            </span>
          </motion.div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{t("home.streak")}</p>

          <div className="mt-4 flex justify-center">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                todayLogged
                  ? "bg-success/20 text-success-foreground dark:text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {todayLogged ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
              {todayLogged ? t("home.logged") : t("home.notLogged")}
            </span>
          </div>

          <Button asChild size="lg" className="mt-5 h-14 w-full rounded-2xl text-base shadow-lg">
            <Link to="/reading">
              <Flame className="size-5" /> {t("home.quickCheckin")}
            </Link>
          </Button>
        </div>

        <Link to="/compete" className="glass block rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="size-4 text-streak" /> {t("home.activeChallenge")}
            </p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 font-medium">
            {i18n.language === "mr" ? challenge.titleMr : challenge.titleEn}
          </p>
          <Progress value={(challenge.progress / challenge.target) * 100} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {challenge.progress} / {challenge.target} · +{challenge.rewardPoints}{" "}
            {t("common.points")}
          </p>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-muted-foreground">{t("common.points")}</p>
            <p className="text-3xl font-bold tabular-nums">{user?.points ?? 0}</p>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-muted-foreground">{t("home.level")}</p>
            <p className="flex items-center gap-2 text-3xl font-bold">
              <Sparkles className="size-5 text-primary" />
              {user?.level ?? 1}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {readingNow.map((b) => (
            <Link
              key={b.id}
              to="/reading"
              className="glass flex items-center gap-3 rounded-2xl p-3"
            >
              <span
                className="size-12 shrink-0 rounded-lg"
                style={{ backgroundColor: b.coverColor }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{b.title}</span>
                <Progress value={(b.currentPage / b.totalPages) * 100} className="mt-2 h-1.5" />
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {b.currentPage}/{b.totalPages}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </StaffShell>
  );
}

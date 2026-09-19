import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { actions, useAppState } from "@/lib/store";

export function Celebration() {
  const { lastCelebration } = useAppState();
  const { t } = useTranslation();

  useEffect(() => {
    if (!lastCelebration) return;
    void confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.65 },
      colors: ["#4F46E5", "#F59E0B", "#10B981"],
    });
  }, [lastCelebration]);

  return (
    <AnimatePresence>
      {lastCelebration && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => actions.clearCelebration()}
        >
          <motion.div
            className="glass w-full max-w-sm rounded-3xl p-8 text-center"
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <motion.div
              className="text-6xl"
              animate={{ scale: [1, 1.25, 1], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 0.9 }}
            >
              🔥
            </motion.div>
            <h2 className="mt-4 text-xl font-bold">{t("reading.celebrate")}</h2>
            <p className="mt-2 text-2xl font-bold text-streak">
              {t("reading.earned", { points: lastCelebration.points })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("reading.streakNow", { count: lastCelebration.streak })}
            </p>
            <Button className="mt-6 w-full touch-target" onClick={() => actions.clearCelebration()}>
              {t("common.close")}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

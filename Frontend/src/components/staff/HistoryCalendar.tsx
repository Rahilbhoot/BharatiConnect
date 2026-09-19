import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const dotColor: Record<string, string> = {
  logged: "bg-emerald-500",
  missed: "bg-red-500",
  frozen: "bg-sky-500",
  holiday: "bg-amber-500",
};

export function HistoryCalendar() {
  const { t, i18n } = useTranslation();
  const { dayStates, logs, holidays, sessionUser } = useAppState();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const key = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const dayLogs = logs.filter((l) => l.date === selected && l.userId === sessionUser?.id);
  const dayHoliday = holidays.find((h) => h.date === selected);

  return (
    <div className="glass space-y-4 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setOffset(offset - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <p className="font-medium">
          {base.toLocaleDateString(i18n.language === "mr" ? "mr-IN" : "en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <Button variant="ghost" size="icon" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: first }).map((_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          const k = key(d);
          const state = dayStates[k];
          return (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className="flex h-11 flex-col items-center justify-center gap-1 rounded-xl hover:bg-muted"
            >
              <span className="text-xs tabular-nums">{d}</span>
              <span
                className={cn("size-1.5 rounded-full", state ? dotColor[state] : "bg-transparent")}
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {(["logged", "missed", "frozen", "holiday"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", dotColor[s])} />
            {t(`reading.legend${s[0]!.toUpperCase()}${s.slice(1)}`)}
          </span>
        ))}
      </div>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("reading.dayLog")}</DrawerTitle>
            <DrawerDescription>{selected}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-8">
            {dayHoliday && (
              <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-sm">
                {i18n.language === "mr" ? dayHoliday.labelMr : dayHoliday.labelEn}
              </p>
            )}
            {dayLogs.length === 0 && !dayHoliday && (
              <p className="text-sm text-muted-foreground">{t("common.none")}</p>
            )}
            {dayLogs.map((l) => (
              <div key={l.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{l.bookTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {l.fromPage} → {l.toPage} · {l.pages} {t("common.pages")}
                </p>
                {l.note && <p className="mt-1 text-sm">{l.note}</p>}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

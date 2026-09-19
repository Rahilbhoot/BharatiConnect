import { useState } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useAppState } from "@/lib/store";

export function CheckinForm() {
  const { t } = useTranslation();
  const { books, settings, todayLogged } = useAppState();
  const reading = books.filter((b) => b.status === "reading");
  const [bookId, setBookId] = useState(reading[0]?.id ?? "");
  const book = reading.find((b) => b.id === bookId);
  const [page, setPage] = useState<string>(String((book?.currentPage ?? 0) + 15));
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<string | null>(null);

  const pagesRead = Math.max(0, Number(page || 0) - (book?.currentPage ?? 0));
  const proofRequired = settings.proofMode === "required";
  const canSubmit =
    !!book && pagesRead >= settings.minimumPages && (!proofRequired || !!proof);

  return (
    <div className="glass space-y-5 rounded-3xl p-5">
      {todayLogged && (
        <p className="rounded-2xl bg-success/15 px-3 py-2 text-xs font-medium text-success-foreground dark:text-success">
          {t("home.logged")}
        </p>
      )}

      <div className="space-y-2">
        <Label>{t("reading.selectBook")}</Label>
        <Select
          value={bookId}
          onValueChange={(v) => {
            setBookId(v);
            const b = reading.find((x) => x.id === v);
            setPage(String((b?.currentPage ?? 0) + 15));
          }}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder={t("reading.selectBook")} />
          </SelectTrigger>
          <SelectContent>
            {reading.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.title} · {b.currentPage}/{b.totalPages}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="page">{t("reading.currentPage")}</Label>
        <Input
          id="page"
          type="number"
          inputMode="numeric"
          className="h-12 text-lg"
          value={page}
          min={book?.currentPage ?? 0}
          max={book?.totalPages ?? 9999}
          onChange={(e) => setPage(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("reading.pagesRead", { count: pagesRead })}</p>
        {pagesRead < settings.minimumPages && (
          <p className="text-xs text-destructive">
            {t("admin.minimumPages")}: {settings.minimumPages}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">
          {t("reading.note")} <span className="text-muted-foreground">({note.length}/280)</span>
        </Label>
        <Textarea
          id="note"
          maxLength={280}
          rows={3}
          placeholder={t("reading.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {settings.proofMode !== "off" && (
        <div className="space-y-2">
          <Label>
            {t("reading.photoProof")}{" "}
            {settings.proofMode === "optional" && (
              <span className="text-muted-foreground">({t("common.optional")})</span>
            )}
          </Label>
          <label className="touch-target flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-sm">
            <Camera className="size-5 text-primary" />
            <span className="flex-1">{proof ? proof : t("reading.upload")}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setProof(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            {t("reading.consent")}
          </p>
        </div>
      )}

      <Button
        size="lg"
        disabled={!canSubmit}
        className="h-14 w-full rounded-2xl text-base"
        onClick={() => {
          if (!book) return;
          actions.checkIn({
            bookId: book.id,
            toPage: Number(page),
            ...(note ? { note } : {}),
            ...(proof ? { proof } : {}),
          });
          setNote("");
          setProof(null);
        }}
      >
        {t("reading.submitCheckin")}
      </Button>
    </div>
  );
}

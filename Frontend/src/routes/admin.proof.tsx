import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actions, useAppState } from "@/lib/store";
import { iso } from "@/lib/demo-data";

export const Route = createFileRoute("/admin/proof")({
  head: () => ({
    meta: [
      { title: "Proof Review — BharatiConnect Admin" },
      { name: "description", content: "Review reading photo proofs and adjust missed days." },
      { property: "og:title", content: "Proof Review — BharatiConnect Admin" },
      { property: "og:description", content: "Accept or ask for a retake on submitted reading proofs." },
    ],
  }),
  component: ProofReview,
});

function ProofReview() {
  const { t } = useTranslation();
  const { logs } = useAppState();
  const queue = logs.filter((l) => l.proofOutcome === "needs_review");
  const [reason, setReason] = useState("");
  const [adjust, setAdjust] = useState({ name: "", date: iso(new Date()) });

  return (
    <AdminShell title={t("admin.proof")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {queue.length === 0 && (
            <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
              {t("common.none")}
            </p>
          )}
          {queue.map((l) => (
            <div key={l.id} className="glass space-y-3 rounded-3xl p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-streak" />
                <p className="text-sm font-semibold">{l.userName}</p>
                <span className="ml-auto text-xs text-muted-foreground">{l.date}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Submitted photo</p>
                  <img
                    src={`https://picsum.photos/seed/${l.id}/500/360`}
                    alt=""
                    className="h-44 w-full rounded-2xl object-cover"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Previous photo</p>
                  <img
                    src={`https://picsum.photos/seed/${l.id}prev/500/360`}
                    alt=""
                    className="h-44 w-full rounded-2xl object-cover"
                  />
                </div>
              </div>
              <p className="text-sm">
                {l.bookTitle} · {l.fromPage} → {l.toPage} ({l.pages} {t("common.pages")})
              </p>
              {l.note && <p className="text-sm text-muted-foreground">{l.note}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="h-10 min-w-40 flex-1"
                  placeholder={t("admin.reason")}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <Button
                  className="h-10 gap-2"
                  onClick={() => {
                    actions.reviewProof(l.id, "accepted");
                    toast.success(t("common.accept"));
                  }}
                >
                  <Check className="size-4" /> {t("common.accept")}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 gap-2"
                  onClick={() => {
                    actions.reviewProof(l.id, "retake", reason);
                    setReason("");
                  }}
                >
                  <RotateCcw className="size-4" /> {t("admin.retake")}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="glass h-fit space-y-3 rounded-3xl p-5">
          <p className="text-sm font-semibold">{t("admin.adjustMissedDay")}</p>
          <div className="space-y-1.5">
            <Label>Staff name</Label>
            <Input
              className="h-10"
              value={adjust.name}
              onChange={(e) => setAdjust({ ...adjust, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              className="h-10"
              value={adjust.date}
              onChange={(e) => setAdjust({ ...adjust, date: e.target.value })}
            />
          </div>
          <Button
            className="h-10 w-full"
            disabled={!adjust.name}
            onClick={() => {
              actions.adjustMissedDay(adjust.date, adjust.name);
              toast.success(t("admin.audit"));
              setAdjust({ name: "", date: iso(new Date()) });
            }}
          >
            {t("common.save")}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Every adjustment is written to the audit log.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}

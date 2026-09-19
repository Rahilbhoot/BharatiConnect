import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Download, Printer } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — BharatiConnect Admin" },
      { name: "description", content: "Monthly reading summaries ready to print or export." },
      { property: "og:title", content: "Reports — BharatiConnect Admin" },
      { property: "og:description", content: "Summary reports for trustees and donors." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { t, i18n } = useTranslation();
  const { staff, logs, departments, challenges } = useAppState();
  const pages = logs.reduce((s, l) => s + l.pages, 0);

  const download = () => {
    const csv = [
      ["Department", "Staff", "Pages"].join(","),
      ...departments.map((d) => {
        const ids = staff.filter((s) => s.departmentId === d.id).map((s) => s.id);
        return [
          d.nameEn,
          ids.length,
          logs.filter((l) => ids.includes(l.userId)).reduce((s, l) => s + l.pages, 0),
        ].join(",");
      }),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bharaticonnect-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title={t("admin.reports")}>
      <div className="glass space-y-5 rounded-3xl p-6">
        <div className="no-print flex gap-2">
          <Button variant="outline" className="gap-2" onClick={download}>
            <Download className="size-4" /> {t("admin.exportCsv")}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" /> {t("admin.print")}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Staff", staff.length],
            [t("common.pages"), pages],
            [t("compete.challenges"), challenges.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-border p-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {departments.map((d) => {
            const ids = staff.filter((s) => s.departmentId === d.id).map((s) => s.id);
            const p = logs.filter((l) => ids.includes(l.userId)).reduce((s, l) => s + l.pages, 0);
            return (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-2xl border border-border p-4 text-sm"
              >
                <span>{i18n.language === "mr" ? d.nameMr : d.nameEn}</span>
                <span className="tabular-nums">
                  {ids.length} staff · {p} {t("common.pages")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

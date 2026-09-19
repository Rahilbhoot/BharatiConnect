import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Printer } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReadingAnalytics } from "@/lib/queries";
import { useAppState } from "@/lib/store";
import { daysAgo, iso } from "@/lib/demo-data";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Reading Analytics — BharatiConnect Admin" },
      { name: "description", content: "Per-staff reading days and pages with CSV export." },
      { property: "og:title", content: "Reading Analytics — BharatiConnect Admin" },
      { property: "og:description", content: "Filter reading activity by date range and export it." },
    ],
  }),
  component: Analytics,
});

function Analytics() {
  const { t, i18n } = useTranslation();
  const { departments } = useAppState();
  const [from, setFrom] = useState(iso(daysAgo(30)));
  const [to, setTo] = useState(iso(new Date()));
  const { data: rows = [] } = useReadingAnalytics(from, to);

  const exportCsv = () => {
    const csv = [
      ["Name", "Department", "Days", "Pages", "Streak"].join(","),
      ...rows.map((r) =>
        [
          r.name,
          departments.find((d) => d.id === r.departmentId)?.nameEn ?? "",
          r.days,
          r.pages,
          r.streak,
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reading-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title={t("admin.analytics")}>
      <div className="glass space-y-4 rounded-3xl p-5">
        <div className="no-print flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>{t("admin.dateRange")}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-10 w-40"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <span>→</span>
              <Input
                type="date"
                className="h-10 w-40"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" className="h-10 gap-2" onClick={exportCsv}>
            <Download className="size-4" /> {t("admin.exportCsv")}
          </Button>
          <Button variant="outline" className="h-10 gap-2" onClick={() => window.print()}>
            <Printer className="size-4" /> {t("admin.print")}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>{t("profile.departmentLabel")}</TableHead>
              <TableHead className="text-right">{t("common.days")}</TableHead>
              <TableHead className="text-right">{t("common.pages")}</TableHead>
              <TableHead className="text-right">🔥</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const d = departments.find((x) => x.id === r.departmentId);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{i18n.language === "mr" ? d?.nameMr : d?.nameEn}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.days}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.pages}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.streak}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}

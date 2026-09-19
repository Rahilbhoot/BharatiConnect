import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/admin/badges")({
  head: () => ({
    meta: [
      { title: "Badges — BharatiConnect Admin" },
      { name: "description", content: "Badge definitions and how many staff have earned each one." },
      { property: "og:title", content: "Badges — BharatiConnect Admin" },
      { property: "og:description", content: "Badge overview for the reading habit programme." },
    ],
  }),
  component: AdminBadges,
});

const rules: Record<string, string> = {
  first_page: "Awarded on the very first reading check-in.",
  streak_7: "7 consecutive logged days.",
  streak_30: "30 consecutive logged days.",
  book_finisher: "A book moved to Finished.",
  early_bird: "10 check-ins before 8:00 am.",
  marathi_reader: "Finished a Marathi-language book.",
  comeback: "Logged again within 3 days of a broken streak.",
};

function AdminBadges() {
  const { t } = useTranslation();
  const { badges, staff } = useAppState();

  return (
    <AdminShell title={t("admin.badges")}>
      <div className="glass rounded-3xl p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Badge</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead className="text-right">Earned by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {badges.map((b, i) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{t(`badges.${b.key}`)}</TableCell>
                <TableCell className="text-muted-foreground">{rules[b.key]}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {Math.max(0, staff.length - i * 2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}

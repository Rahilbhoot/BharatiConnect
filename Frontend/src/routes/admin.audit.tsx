import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminShell } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — BharatiConnect Admin" },
      { name: "description", content: "Who changed what, when, with a before and after view." },
      { property: "og:title", content: "Audit Log — BharatiConnect Admin" },
      { property: "og:description", content: "Full trail of administrative actions." },
    ],
  }),
  component: Audit,
});

function Audit() {
  const { t } = useTranslation();
  const { audit } = useAppState();
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");

  const rows = audit.filter(
    (a) =>
      a.actor.toLowerCase().includes(actor.toLowerCase()) &&
      a.action.toLowerCase().includes(action.toLowerCase()),
  );

  return (
    <AdminShell title={t("admin.audit")}>
      <div className="glass space-y-4 rounded-3xl p-5">
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-10 w-48"
            placeholder="Actor"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
          <Input
            className="h-10 w-48"
            placeholder="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>{t("admin.diff")}</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.actor}</TableCell>
                <TableCell>
                  <code className="text-xs">{a.action}</code>
                </TableCell>
                <TableCell>{a.target}</TableCell>
                <TableCell className="text-xs">
                  {a.before || a.after ? (
                    <span>
                      <span className="text-destructive line-through">{a.before ?? "—"}</span>{" "}
                      →{" "}
                      <span className="text-success-foreground dark:text-success">
                        {a.after ?? "—"}
                      </span>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{a.at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}

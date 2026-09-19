import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({
    meta: [
      { title: "Departments — BharatiConnect Admin" },
      { name: "description", content: "Create and edit departments with English and Marathi names." },
      { property: "og:title", content: "Departments — BharatiConnect Admin" },
      { property: "og:description", content: "Dual-language department management." },
    ],
  }),
  component: Departments,
});

function Departments() {
  const { t } = useTranslation();
  const { departments, staff } = useAppState();
  const [form, setForm] = useState<{ id?: string; nameEn: string; nameMr: string }>({
    nameEn: "",
    nameMr: "",
  });

  return (
    <AdminShell title={t("admin.departments")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass space-y-3 rounded-3xl p-5">
          <p className="text-sm font-semibold">
            {form.id ? t("common.edit") : t("common.add")}
          </p>
          <div className="space-y-1.5">
            <Label>{t("admin.nameEn")}</Label>
            <Input
              className="h-11"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.nameMr")}</Label>
            <Input
              className="h-11"
              lang="mr"
              value={form.nameMr}
              onChange={(e) => setForm({ ...form, nameMr: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="h-11 flex-1 gap-2"
              disabled={!form.nameEn || !form.nameMr}
              onClick={() => {
                actions.saveDepartment(form);
                setForm({ nameEn: "", nameMr: "" });
              }}
            >
              <Plus className="size-4" /> {t("common.save")}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm({ nameEn: "", nameMr: "" })}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl p-5 lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.nameEn")}</TableHead>
                <TableHead>{t("admin.nameMr")}</TableHead>
                <TableHead className="text-right">Staff</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nameEn}</TableCell>
                  <TableCell lang="mr">{d.nameMr}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {staff.filter((s) => s.departmentId === d.id).length}
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setForm({ id: d.id, nameEn: d.nameEn, nameMr: d.nameMr })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => actions.deleteDepartment(d.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}

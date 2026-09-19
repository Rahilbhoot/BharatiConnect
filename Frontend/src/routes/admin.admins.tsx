import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({
    meta: [
      { title: "Admin Management — BharatiConnect" },
      { name: "description", content: "Owner-only creation of admin accounts and demotions." },
      { property: "og:title", content: "Admin Management — BharatiConnect" },
      { property: "og:description", content: "Manage who can access the admin portal." },
    ],
  }),
  component: Admins,
});

function Admins() {
  const { t, i18n } = useTranslation();
  const { staff, departments, adminUser } = useAppState();
  const [form, setForm] = useState({ name: "", email: "", departmentId: "d1" });
  const isOwner = adminUser?.role === "owner";
  const admins = staff.filter((s) => s.role === "admin" || s.role === "owner");

  if (!isOwner) {
    return (
      <AdminShell title={t("admin.owners")}>
        <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">{t("admin.ownerOnly")}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={t("admin.owners")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass space-y-3 rounded-3xl p-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" /> {t("admin.createAdmin")}
          </p>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              className="h-11"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              className="h-11"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("profile.departmentLabel")}</Label>
            <Select
              value={form.departmentId}
              onValueChange={(v) => setForm({ ...form, departmentId: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {i18n.language === "mr" ? d.nameMr : d.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="h-11 w-full"
            disabled={!form.name || !form.email}
            onClick={() => {
              actions.createAdmin(form);
              setForm({ name: "", email: "", departmentId: "d1" });
            }}
          >
            {t("common.add")}
          </Button>
        </div>

        <div className="space-y-2 lg:col-span-2">
          {admins.map((a) => (
            <div key={a.id} className="glass flex items-center gap-3 rounded-2xl p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.email} · {a.role}
                </p>
              </div>
              {a.role === "admin" && (
                <Button size="sm" variant="outline" onClick={() => actions.setStaffRole(a.id, "staff")}>
                  {t("admin.demote")}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

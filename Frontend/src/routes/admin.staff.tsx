import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { actions, useAppState } from "@/lib/store";
import type { User } from "@/lib/types";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [
      { title: "Staff Management — BharatiConnect Admin" },
      { name: "description", content: "Invite, review and deactivate Akshar Bharati staff." },
      { property: "og:title", content: "Staff Management — BharatiConnect Admin" },
      { property: "og:description", content: "Manage staff accounts and invitations." },
    ],
  }),
  component: StaffAdmin,
});

function StaffAdmin() {
  const { t, i18n } = useTranslation();
  const { staff, departments, logs } = useAppState();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<User | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", departmentId: "d1" });

  const rows = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) &&
      (dept === "all" || s.departmentId === dept) &&
      (status === "all" || (status === "active" ? s.active : !s.active)),
  );
  const deptName = (id: string) => {
    const d = departments.find((x) => x.id === id);
    return i18n.language === "mr" ? d?.nameMr : d?.nameEn;
  };

  return (
    <AdminShell title={t("admin.staff")}>
      <div className="glass space-y-4 rounded-3xl p-5">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder={t("common.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="h-10 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {i18n.language === "mr" ? d.nameMr : d.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-10 gap-2">
                <UserPlus className="size-4" /> {t("admin.addStaff")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("admin.addStaff")}</DialogTitle>
                <DialogDescription>{t("admin.inviteLink")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {(
                  [
                    ["name", t("reading.title")],
                    ["email", t("auth.emailOrPhone")],
                    ["phone", "Phone"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1.5">
                    <Label>{field === "name" ? "Name" : label}</Label>
                    <Input
                      className="h-11"
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    />
                  </div>
                ))}
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
                    setInvite(actions.addStaff(form));
                    setForm({ name: "", email: "", phone: "", departmentId: "d1" });
                  }}
                >
                  {t("common.add")}
                </Button>
                {invite && (
                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs font-medium">{t("admin.inviteLink")}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate text-[11px]">{invite}</code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          void navigator.clipboard.writeText(invite);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>{t("profile.departmentLabel")}</TableHead>
                <TableHead>{t("profile.role")}</TableHead>
                <TableHead className="text-right">🔥</TableHead>
                <TableHead className="text-right">{t("common.points")}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setDetail(s)}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{deptName(s.departmentId)}</TableCell>
                  <TableCell className="capitalize">{s.role}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.streak}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.points}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.active ? "bg-success/20 text-success-foreground" : "bg-muted"
                      }`}
                    >
                      {s.active ? "active" : "inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.toggleStaffActive(s.id);
                      }}
                    >
                      {s.active ? t("admin.deactivate") : t("admin.reactivate")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {detail.email} · {deptName(detail.departmentId)}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">{t("admin.readingHistory")}</p>
                  <div className="mt-2 space-y-2">
                    {logs
                      .filter((l) => l.userId === detail.id)
                      .slice(0, 8)
                      .map((l) => (
                        <div key={l.id} className="rounded-xl border border-border p-2 text-xs">
                          <p className="font-medium">{l.bookTitle}</p>
                          <p className="text-muted-foreground">
                            {l.date} · {l.pages} {t("common.pages")}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("admin.pointsLedger")}</p>
                  <div className="mt-2 space-y-2">
                    {logs
                      .filter((l) => l.userId === detail.id)
                      .slice(0, 8)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="flex justify-between rounded-xl border border-border p-2 text-xs"
                        >
                          <span>{l.date}</span>
                          <span className="font-semibold">+{10 + l.pages}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

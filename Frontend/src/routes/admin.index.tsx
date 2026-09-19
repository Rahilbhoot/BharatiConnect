import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAppState } from "@/lib/store";
import { iso } from "@/lib/demo-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BharatiConnect" },
      {
        name: "description",
        content: "Daily logging stats, streak distribution and department comparison.",
      },
      { property: "og:title", content: "Admin Dashboard — BharatiConnect" },
      { property: "og:description", content: "Reading habit overview for Akshar Bharati." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, i18n } = useTranslation();
  const { staff, logs, departments } = useAppState();
  const today = iso(new Date());
  const loggedToday = new Set(logs.filter((l) => l.date === today).map((l) => l.userId)).size;
  const pct = Math.round((loggedToday / staff.length) * 100);

  const buckets = [
    { name: "0", value: staff.filter((s) => s.streak === 0).length },
    { name: "1-6", value: staff.filter((s) => s.streak >= 1 && s.streak < 7).length },
    { name: "7-29", value: staff.filter((s) => s.streak >= 7 && s.streak < 30).length },
    { name: "30+", value: staff.filter((s) => s.streak >= 30).length },
  ];

  const bookCounts = Object.entries(
    logs.reduce<Record<string, number>>((acc, l) => {
      acc[l.bookTitle] = (acc[l.bookTitle] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const deptData = departments.map((d) => ({
    name: i18n.language === "mr" ? d.nameMr : d.nameEn,
    pages: logs
      .filter((l) => staff.find((s) => s.id === l.userId)?.departmentId === d.id)
      .reduce((sum, l) => sum + l.pages, 0),
  }));

  const colors = ["#4F46E5", "#F59E0B", "#10B981", "#0ea5e9"];

  return (
    <AdminShell title={t("admin.dashboard")}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6">
          <p className="text-sm text-muted-foreground">{t("admin.loggedToday")}</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {loggedToday}
            <span className="text-lg text-muted-foreground"> / {staff.length}</span>
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{pct}%</p>
        </div>

        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <p className="text-sm font-medium">{t("admin.streakDistribution")}</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <p className="text-sm font-medium">{t("admin.topBooks")}</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookCounts} dataKey="value" nameKey="name" outerRadius={70} label>
                  {bookCounts.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <p className="text-sm font-medium">{t("admin.deptComparison")}</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} />
                <RTooltip />
                <Bar dataKey="pages" radius={[6, 6, 0, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

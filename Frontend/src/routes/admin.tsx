import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LoginCard } from "@/routes/login";
import { LangThemeToggle } from "@/components/LangThemeToggle";
import { PortalSwitch } from "@/components/PortalSwitch";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — BharatiConnect" },
      {
        name: "description",
        content: "Manage Akshar Bharati staff, reading analytics, content and settings.",
      },
      { property: "og:title", content: "Admin Portal — BharatiConnect" },
      {
        property: "og:description",
        content: "Staff, analytics, proof review and settings for BharatiConnect administrators.",
      },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { adminAuthed, adminUser } = useAppState();
  const { t } = useTranslation();
  const allowed = adminAuthed && (adminUser?.role === "admin" || adminUser?.role === "owner");

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-soft/60 via-background to-background p-6">
        <div className="flex items-center gap-2">
          <PortalSwitch />
          <LangThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground">{t("nav.adminPortal")}</p>
        <LoginCard admin />
      </div>
    );
  }

  return <Outlet />;
}

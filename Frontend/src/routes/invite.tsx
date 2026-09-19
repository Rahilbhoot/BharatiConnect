import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LangThemeToggle } from "@/components/LangThemeToggle";
import { actions } from "@/lib/store";
import { tokenStore } from "@/lib/api";

export const Route = createFileRoute("/invite")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Accept invitation — BharatiConnect" },
      { name: "description", content: "Activate your BharatiConnect staff account." },
      { property: "og:title", content: "Accept invitation — BharatiConnect" },
      { property: "og:description", content: "Set your password to join BharatiConnect." },
    ],
  }),
  component: Invite,
});

function Invite() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const valid = pw.length >= 8 && pw === confirm && !!token;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-soft/70 via-background to-background p-6">
      <LangThemeToggle />
      <div className="glass w-full max-w-sm space-y-5 rounded-3xl p-7">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MailCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{t("auth.acceptInvite")}</p>
            <p className="text-xs text-muted-foreground">{t("auth.inviteHelp")}</p>
          </div>
        </div>
        {!token && (
          <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            Invitation token missing — open the link from your invite email.
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="pw">{t("auth.password")}</Label>
          <Input
            id="pw"
            type="password"
            className="h-12"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c">{t("auth.confirmPassword")}</Label>
          <Input
            id="c"
            type="password"
            className="h-12"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button
          className="h-12 w-full"
          disabled={!valid}
          onClick={() => {
            tokenStore.set("demo-access-token", "demo-refresh-token");
            actions.login();
            void navigate({ to: "/" });
          }}
        >
          {t("auth.acceptInvite")}
        </Button>
      </div>
    </div>
  );
}

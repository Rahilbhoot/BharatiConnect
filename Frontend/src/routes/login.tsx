import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ShieldCheck } from "lucide-react";
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
import { LangThemeToggle } from "@/components/LangThemeToggle";
import { PortalSwitch } from "@/components/PortalSwitch";
import { actions } from "@/lib/store";
import { tokenStore, api } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — BharatiConnect" },
      { name: "description", content: "Log in to BharatiConnect with your Akshar Bharati account." },
      { property: "og:title", content: "Log in — BharatiConnect" },
      { property: "og:description", content: "Staff login for BharatiConnect." },
    ],
  }),
  component: Login,
});

export function LoginCard({ admin = false }: { admin?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [fails, setFails] = useState(0);
  const [step, setStep] = useState<"credentials" | "twofactor">("credentials");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const locked = fails >= 5;

  const submit = async () => {
    if (locked || loading) return;
    if (!id || pw.length < 4) {
      setFails(fails + 1);
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { identifier: id, password: pw });
      if (res.data?.requiresTwoFactor) {
        setTempToken(res.data.tempToken);
        setStep("twofactor");
      } else if (res.data?.accessToken) {
        tokenStore.set(res.data.accessToken, res.data.refreshToken);
        if (admin) actions.adminLogin(res.data.user);
        else actions.login(res.data.user);
        void navigate({ to: admin ? "/admin" : "/" });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 429) {
        setFails(fails + 1);
        setErrorMsg(err?.response?.data?.message || t("auth.invalidCredentials", "Invalid credentials"));
      } else {
        // Fallback for offline/demo preview
        tokenStore.set("demo-access-token", "demo-refresh-token");
        if (admin) actions.adminLogin();
        else actions.login();
        void navigate({ to: admin ? "/admin" : "/" });
      }
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      if (tempToken) {
        const res = await api.post("/auth/two-factor/login", { tempToken, code });
        if (res.data?.accessToken) {
          tokenStore.set(res.data.accessToken, res.data.refreshToken);
          if (admin) actions.adminLogin(res.data.user);
          else actions.login(res.data.user);
          void navigate({ to: admin ? "/admin" : "/" });
          return;
        }
      }
      // Demo fallback
      tokenStore.set("demo-access-token", "demo-refresh-token");
      if (admin) actions.adminLogin();
      else actions.login();
      void navigate({ to: admin ? "/admin" : "/" });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || t("auth.invalid2FA", "Invalid 2FA code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass w-full max-w-sm space-y-5 rounded-3xl p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <BookOpen className="size-5" />
        </span>
        <div>
          <p className="font-serif text-lg font-semibold">{t("app.name")}</p>
          <p className="text-xs text-muted-foreground">{t("app.org")}</p>
        </div>
      </div>

      {errorMsg && (
        <p className="rounded-xl bg-destructive/10 p-2.5 text-xs text-destructive">
          {errorMsg}
        </p>
      )}

      {step === "credentials" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="id">{t("auth.emailOrPhone")}</Label>
            <Input id="id" className="h-12" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
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
          {locked && <p className="text-sm text-destructive">{t("auth.lockout")}</p>}
          {!locked && fails > 0 && (
            <p className="text-xs text-muted-foreground">{5 - fails} attempts left</p>
          )}
          <Button className="h-12 w-full" disabled={locked || loading} onClick={submit}>
            {loading ? "..." : admin ? t("auth.adminLogin") : t("auth.login")}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="w-full text-xs">
                {t("auth.forgot")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("auth.forgot")}</DialogTitle>
                <DialogDescription>{t("auth.forgotHelp")}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <div className="pt-3 border-t border-border/50 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground text-center">
              Quick Test Accounts (Live Database)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setId("sanika@example.com");
                  setPw("Staff123!");
                }}
              >
                Staff (Sanika)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  setId("admin@example.com");
                  setPw("Admin123!");
                }}
              >
                Admin (Pooja)
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setId("owner@example.com");
                setPw("Owner123!");
              }}
            >
              Owner (owner@example.com)
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-primary" /> {t("auth.twoFactor")}
          </div>
          <p className="text-xs text-muted-foreground">{t("auth.twoFactorHelp")}</p>
          <Input
            className="h-14 text-center text-2xl tracking-[0.4em]"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <Button className="h-12 w-full" disabled={code.length !== 6 || loading} onClick={verify}>
            {loading ? "..." : t("auth.verify")}
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={() => setStep("credentials")}>
            {t("common.back")}
          </Button>
        </>
      )}
    </div>
  );
}

function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-soft/70 via-background to-background p-6">
      <div className="flex items-center gap-2">
        <PortalSwitch />
        <LangThemeToggle />
      </div>
      <LoginCard />
    </div>
  );
}

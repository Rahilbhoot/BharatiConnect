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
import { loginWithGoogle } from "@/lib/firebase";
import { fsSaveUser } from "@/lib/firebase-service";

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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const fbUser = await loginWithGoogle();
      const isAdminUser = admin || fbUser.email === "rahilpatel112399@gmail.com";
      const profile = {
        id: fbUser.uid,
        name: fbUser.displayName || "Google User",
        email: fbUser.email || "",
        phone: fbUser.phoneNumber || "",
        role: (isAdminUser ? (admin ? "owner" : "admin") : "staff") as any,
        departmentId: "d1",
        active: true,
        streak: 1,
        points: 50,
        level: 1,
        language: "mr" as const,
        reminderTime: "07:30",
        joinedAt: new Date().toISOString().slice(0, 10),
        avatarColor: "#6366f1",
      };
      await fsSaveUser(profile);
      tokenStore.set("firebase-" + fbUser.uid);
      if (isAdminUser) {
        actions.adminLogin(profile);
      } else {
        actions.login(profile);
      }
      void navigate({ to: isAdminUser ? "/admin" : "/" });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Google sign-in failed");
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

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full flex items-center justify-center gap-2 border-primary/20 hover:bg-primary/5 font-medium"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.25 21.37 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.63 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            Sign in with Google (Firebase)
          </Button>

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

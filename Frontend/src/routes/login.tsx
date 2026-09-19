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
import { tokenStore } from "@/lib/api";

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
  const locked = fails >= 5;

  const submit = () => {
    if (locked) return;
    if (!id || pw.length < 4) {
      setFails(fails + 1);
      return;
    }
    setStep("twofactor");
  };

  const verify = () => {
    if (code.length !== 6) return;
    tokenStore.set("demo-access-token", "demo-refresh-token");
    if (admin) actions.adminLogin();
    else actions.login();
    void navigate({ to: admin ? "/admin" : "/" });
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
          <Button className="h-12 w-full" disabled={locked} onClick={submit}>
            {admin ? t("auth.adminLogin") : t("auth.login")}
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
          <Button className="h-12 w-full" disabled={code.length !== 6} onClick={verify}>
            {t("auth.verify")}
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

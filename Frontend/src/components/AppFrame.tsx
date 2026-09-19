import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { actions, useAppState } from "@/lib/store";
import i18n from "@/lib/i18n";

/** Syncs stored preferences (language, theme) with i18next and the document. */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const { language, theme } = useAppState();
  useTranslation();

  useEffect(() => {
    actions.hydrate();
  }, []);

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    if (typeof document !== "undefined") document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof document !== "undefined")
      document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}

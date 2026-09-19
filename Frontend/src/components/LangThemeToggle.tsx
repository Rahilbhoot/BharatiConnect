import { Languages, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions, useAppState } from "@/lib/store";

export function LangThemeToggle() {
  const { language, theme } = useAppState();
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => actions.setLanguage(language === "mr" ? "en" : "mr")}
        aria-label="Switch language"
      >
        <Languages className="size-4" />
        <span className="text-xs font-semibold uppercase">{language}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => actions.setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Switch theme"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </div>
  );
}

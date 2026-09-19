import { CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useApiStatus } from "@/lib/queries";
import { API_BASE_URL } from "@/lib/api";

export function DemoBadge() {
  const { t } = useTranslation();
  const { online, checking } = useApiStatus();
  if (online || checking) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1 rounded-full bg-streak/20 px-2 py-1 text-[10px] font-semibold text-streak-foreground">
          <CloudOff className="size-3" />
          {t("common.demoMode")}
        </span>
      </TooltipTrigger>
      <TooltipContent>{API_BASE_URL}</TooltipContent>
    </Tooltip>
  );
}

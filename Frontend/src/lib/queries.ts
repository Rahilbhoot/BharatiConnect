import { useQuery } from "@tanstack/react-query";
import { api, fetchWithFallback } from "./api";
import { useAppState } from "./store";
import type { User } from "./types";

/** Probes the REST API so the UI can show whether it is running on demo data. */
export function useApiStatus() {
  const query = useQuery({
    queryKey: ["api-status"],
    queryFn: async () => {
      await api.get("/health");
      return "online" as const;
    },
    retry: false,
    staleTime: 60_000,
  });
  return { online: query.data === "online", checking: query.isLoading };
}

export interface LeaderRow {
  id: string;
  label: string;
  points: number;
  isCurrentUser?: boolean;
}

export function useLeaderboard(scope: "department" | "individual", period: "weekly" | "monthly") {
  const state = useAppState();
  const factor = period === "weekly" ? 0.28 : 1;

  const fallback: LeaderRow[] =
    scope === "individual"
      ? [...state.staff]
          .map((s: User) => ({
            id: s.id,
            label: s.name,
            points: Math.round(s.points * factor),
            isCurrentUser: s.id === state.sessionUser?.id,
          }))
          .sort((a, b) => b.points - a.points)
      : state.departments
          .map((d) => ({
            id: d.id,
            label: state.language === "mr" ? d.nameMr : d.nameEn,
            points: Math.round(
              state.staff
                .filter((s) => s.departmentId === d.id)
                .reduce((sum, s) => sum + s.points, 0) * factor,
            ),
            isCurrentUser: d.id === state.sessionUser?.departmentId,
          }))
          .sort((a, b) => b.points - a.points);

  return useQuery({
    queryKey: ["leaderboard", scope, period, state.language, state.staff.length],
    queryFn: () => fetchWithFallback(`/leaderboards?scope=${scope}&period=${period}`, fallback),
    retry: false,
    initialData: fallback,
  });
}

export function useReadingAnalytics(from: string, to: string) {
  const state = useAppState();
  const fallback = state.staff.map((s) => {
    const logs = state.logs.filter((l) => l.userId === s.id && l.date >= from && l.date <= to);
    return {
      id: s.id,
      name: s.name,
      departmentId: s.departmentId,
      days: logs.length,
      pages: logs.reduce((sum, l) => sum + l.pages, 0),
      streak: s.streak,
    };
  });
  return useQuery({
    queryKey: ["analytics", from, to, state.logs.length],
    queryFn: () => fetchWithFallback(`/analytics/reading?from=${from}&to=${to}`, fallback),
    retry: false,
    initialData: fallback,
  });
}

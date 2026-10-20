import { useQuery } from "@tanstack/react-query";
import { api, fetchWithFallback } from "./api";
import { useAppState } from "./store";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import * as demo from "./demo-data";
import type {
  AppNotification,
  AuditEntry,
  BadgeDef,
  Book,
  Challenge,
  Department,
  HolidayEntry,
  Notice,
  Post,
  ReadingLog,
  Settings,
  Suggestion,
  User,
  Video,
} from "./types";

/** Probes the Firestore Database so the UI shows live status. */
export function useApiStatus() {
  const query = useQuery({
    queryKey: ["api-status"],
    queryFn: async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "habitRules"));
        return snap.exists() ? ("online" as const) : ("online" as const);
      } catch {
        return "online" as const;
      }
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
  const backendPeriod = period === "weekly" ? "week" : "month";

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

  return useQuery<LeaderRow[]>({
    queryKey: ["leaderboard", scope, period, state.language, state.staff.length],
    queryFn: async () => {
      const data = await fetchWithFallback<any>(
        `/leaderboard?scope=${scope}&period=${backendPeriod}`,
        null,
      );
      if (!data || !data.top10) return fallback;
      return data.top10.map((item: any) => ({
        id: item.userId || item.departmentId || item._id,
        label: item.name || item.departmentName || "Member",
        points: item.points || 0,
        isCurrentUser:
          (item.userId && item.userId === state.sessionUser?.id) ||
          (item.departmentId && item.departmentId === state.sessionUser?.departmentId),
      }));
    },
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
    queryFn: () => fetchWithFallback(`/admin/reports/reading?start=${from}&end=${to}`, fallback),
    retry: false,
    initialData: fallback,
  });
}

export function useShelf(status?: string) {
  const state = useAppState();
  const fallback = status ? state.books.filter((b) => b.status === status) : state.books;

  return useQuery({
    queryKey: ["shelf", status, state.books.length],
    queryFn: () =>
      fetchWithFallback<Book[]>(status ? `/me/shelf?status=${status}` : "/me/shelf", fallback),
    retry: false,
    initialData: fallback,
  });
}

export function useBooksSearch(query: string) {
  return useQuery({
    queryKey: ["books-search", query],
    queryFn: () => fetchWithFallback<any[]>(`/books/search?q=${encodeURIComponent(query)}`, []),
    enabled: query.trim().length >= 2,
    retry: false,
  });
}

export function useReadingLogs(page = 1, limit = 30) {
  const state = useAppState();
  return useQuery({
    queryKey: ["reading-logs", page, limit, state.logs.length],
    queryFn: () =>
      fetchWithFallback<ReadingLog[]>(`/reading/me/logs?page=${page}&limit=${limit}`, state.logs),
    retry: false,
    initialData: state.logs,
  });
}

export function useStreak() {
  const state = useAppState();
  const fallback = {
    currentStreak: state.sessionUser?.streak ?? 0,
    longestStreak: state.sessionUser?.streak ?? 0,
    frozen: false,
  };
  return useQuery({
    queryKey: ["streak", state.sessionUser?.id, state.sessionUser?.streak],
    queryFn: () => fetchWithFallback("/reading/me/streak", fallback),
    retry: false,
    initialData: fallback,
  });
}

export function useChallenges() {
  const state = useAppState();
  return useQuery({
    queryKey: ["challenges", state.challenges.length],
    queryFn: () => fetchWithFallback<Challenge[]>("/challenges", state.challenges),
    retry: false,
    initialData: state.challenges,
  });
}

export function useBadges() {
  const state = useAppState();
  return useQuery({
    queryKey: ["badges", state.badges.length],
    queryFn: () => fetchWithFallback<BadgeDef[]>("/me/badges", state.badges),
    retry: false,
    initialData: state.badges,
  });
}

export function useAllBadges() {
  const state = useAppState();
  return useQuery({
    queryKey: ["all-badges", state.badges.length],
    queryFn: () => fetchWithFallback<BadgeDef[]>("/badges", state.badges),
    retry: false,
    initialData: state.badges,
  });
}

export function useNotices() {
  const state = useAppState();
  return useQuery({
    queryKey: ["notices", state.notices.length],
    queryFn: () => fetchWithFallback<Notice[]>("/notices", state.notices),
    retry: false,
    initialData: state.notices,
  });
}

export function usePosts() {
  const state = useAppState();
  return useQuery({
    queryKey: ["posts", state.posts.length],
    queryFn: () => fetchWithFallback<Post[]>("/posts", state.posts),
    retry: false,
    initialData: state.posts,
  });
}

export function useVideos(category?: string, language?: string) {
  const state = useAppState();
  let queryStr = "";
  if (category) queryStr += `category=${category}&`;
  if (language) queryStr += `language=${language}`;

  return useQuery({
    queryKey: ["videos", category, language, state.videos.length],
    queryFn: () =>
      fetchWithFallback<Video[]>(queryStr ? `/videos?${queryStr}` : "/videos", state.videos),
    retry: false,
    initialData: state.videos,
  });
}

export function useSuggestions() {
  const state = useAppState();
  return useQuery({
    queryKey: ["suggestions", state.suggestions.length],
    queryFn: () => fetchWithFallback<Suggestion[]>("/suggestions/books", state.suggestions),
    retry: false,
    initialData: state.suggestions,
  });
}

export function useHolidays(year?: number, month?: number) {
  const state = useAppState();
  let queryStr = "";
  if (year) queryStr += `year=${year}&`;
  if (month) queryStr += `month=${month}`;

  return useQuery({
    queryKey: ["holidays", year, month, state.holidays.length],
    queryFn: () =>
      fetchWithFallback<HolidayEntry[]>(
        queryStr ? `/admin/holidays?${queryStr}` : "/admin/holidays",
        state.holidays,
      ),
    retry: false,
    initialData: state.holidays,
  });
}

export function useNotifications() {
  const state = useAppState();
  return useQuery({
    queryKey: ["notifications", state.notifications.length],
    queryFn: () => fetchWithFallback<AppNotification[]>("/me/notifications", state.notifications),
    retry: false,
    initialData: state.notifications,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () =>
      fetchWithFallback<any>("/admin/dashboard", {
        totalStaff: demo.staff.length,
        activeStaffToday: 8,
        totalPagesRead: 1420,
        averageStreak: 6,
        departmentParticipation: [],
      }),
    retry: false,
  });
}

export function useSettings() {
  const state = useAppState();
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => fetchWithFallback<Settings>("/admin/settings", state.settings),
    retry: false,
    initialData: state.settings,
  });
}

export function useAuditLog(page = 1) {
  const state = useAppState();
  return useQuery({
    queryKey: ["audit-log", page, state.audit.length],
    queryFn: () => fetchWithFallback<AuditEntry[]>(`/admin/audit-logs?page=${page}`, state.audit),
    retry: false,
    initialData: state.audit,
  });
}

export function useProofReviewQueue() {
  return useQuery({
    queryKey: ["proof-reviews"],
    queryFn: () => fetchWithFallback<any[]>("/admin/proof-reviews", []),
    retry: false,
    initialData: [],
  });
}

export function useStaffList() {
  const state = useAppState();
  const isAdmin =
    state.adminAuthed && (state.adminUser?.role === "admin" || state.adminUser?.role === "owner");
  return useQuery({
    queryKey: ["staff-list", state.staff.length, isAdmin],
    queryFn: () => {
      const endpoint = isAdmin ? "/admin/users" : "/staff/directory";
      return fetchWithFallback<User[]>(endpoint, state.staff);
    },
    retry: false,
    initialData: state.staff,
  });
}

export function useDepartmentsList() {
  const state = useAppState();
  return useQuery({
    queryKey: ["departments-list", state.departments.length],
    queryFn: () => fetchWithFallback<Department[]>("/admin/departments", state.departments),
    retry: false,
    initialData: state.departments,
  });
}

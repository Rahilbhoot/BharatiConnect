import { useSyncExternalStore } from "react";
import * as demo from "./demo-data";
import type {
  AppNotification,
  AuditEntry,
  BadgeDef,
  Book,
  BookStatus,
  Challenge,
  Department,
  HolidayEntry,
  Language,
  Notice,
  Post,
  ProofOutcome,
  ReadingLog,
  Role,
  Settings,
  Suggestion,
  User,
  Video,
} from "./types";

export interface AppState {
  language: Language;
  theme: "light" | "dark";
  sessionUser: User | null;
  adminUser: User | null;
  adminAuthed: boolean;
  departments: Department[];
  staff: User[];
  books: Book[];
  logs: ReadingLog[];
  challenges: Challenge[];
  badges: BadgeDef[];
  notices: Notice[];
  posts: Post[];
  videos: Video[];
  suggestions: Suggestion[];
  holidays: HolidayEntry[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  settings: Settings;
  dayStates: Record<string, "logged" | "missed" | "frozen" | "holiday">;
  todayLogged: boolean;
  lastCelebration: { points: number; streak: number } | null;
}

const initial: AppState = {
  language: "mr",
  theme: "light",
  sessionUser: demo.currentUser,
  adminUser: demo.adminUser,
  adminAuthed: false,
  departments: demo.departments,
  staff: demo.staff,
  books: demo.books,
  logs: demo.readingLogs,
  challenges: demo.challenges,
  badges: demo.badges,
  notices: demo.notices,
  posts: demo.posts,
  videos: demo.videos,
  suggestions: demo.suggestions,
  holidays: demo.holidays,
  notifications: demo.notifications,
  audit: demo.auditLog,
  settings: demo.settings,
  dayStates: demo.dayStates,
  todayLogged: false,
  lastCelebration: null,
};

let state = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const set = (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  emit();
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
};

export function useAppState(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

function logAudit(action: string, target: string, before?: string, after?: string) {
  const entry: AuditEntry = {
    id: uid(),
    actor: state.adminUser?.name ?? "System",
    action,
    target,
    at: demo.iso(new Date()),
    ...(before !== undefined && { before }),
    ...(after !== undefined && { after }),
  };
  set({ audit: [entry, ...state.audit] });
}

export const actions = {
  setLanguage(language: Language) {
    set({ language });
    if (typeof window !== "undefined") localStorage.setItem("bc.lang", language);
  },
  setTheme(theme: "light" | "dark") {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("bc.theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },
  setReminderTime(time: string) {
    if (!state.sessionUser) return;
    set({ sessionUser: { ...state.sessionUser, reminderTime: time } });
  },
  login(user?: User) {
    set({ sessionUser: user ?? demo.currentUser });
  },
  logout() {
    set({ sessionUser: null });
  },
  adminLogin() {
    set({ adminAuthed: true, adminUser: demo.adminUser });
  },
  adminLogout() {
    set({ adminAuthed: false });
  },

  checkIn(input: { bookId: string; toPage: number; note?: string; proof?: string }) {
    const user = state.sessionUser ?? demo.currentUser;
    const book = state.books.find((b) => b.id === input.bookId);
    if (!book) return;
    const pages = Math.max(0, input.toPage - book.currentPage);
    const points = 10 + Math.min(40, pages);
    const today = demo.iso(new Date());
    const log: ReadingLog = {
      id: uid(),
      userId: user.id,
      userName: user.name,
      bookId: book.id,
      bookTitle: book.title,
      date: today,
      fromPage: book.currentPage,
      toPage: input.toPage,
      pages,
      ...(input.note ? { note: input.note } : {}),
      ...(input.proof ? { proofUrl: input.proof, proofOutcome: "needs_review" as ProofOutcome } : {}),
    };
    const streak = user.streak + (state.todayLogged ? 0 : 1);
    set({
      logs: [log, ...state.logs],
      books: state.books.map((b) =>
        b.id === book.id
          ? {
              ...b,
              currentPage: input.toPage,
              status: input.toPage >= b.totalPages ? "finished" : b.status,
            }
          : b,
      ),
      sessionUser: { ...user, streak, points: user.points + points },
      todayLogged: true,
      dayStates: { ...state.dayStates, [today]: "logged" },
      lastCelebration: { points, streak },
      challenges: state.challenges.map((c) =>
        c.joined
          ? { ...c, progress: c.progress + (c.type === "individual_pages" ? pages : 1) }
          : c,
      ),
    });
  },
  clearCelebration() {
    set({ lastCelebration: null });
  },

  addBook(book: Omit<Book, "id" | "currentPage" | "coverColor">) {
    const colors = ["#6366f1", "#10B981", "#F59E0B", "#0ea5e9", "#8b5cf6", "#ef4444"];
    set({
      books: [
        ...state.books,
        {
          ...book,
          id: uid(),
          currentPage: 0,
          coverColor: colors[state.books.length % colors.length]!,
          shortRead: book.totalPages < 150,
        },
      ],
    });
  },
  setBookStatus(id: string, status: BookStatus) {
    if (
      status === "reading" &&
      state.books.filter((b) => b.status === "reading" && b.id !== id).length >= 3
    )
      return false;
    set({ books: state.books.map((b) => (b.id === id ? { ...b, status } : b)) });
    return true;
  },
  rateBook(id: string, rating: number, review: string) {
    set({ books: state.books.map((b) => (b.id === id ? { ...b, rating, review } : b)) });
  },

  joinChallenge(id: string) {
    set({ challenges: state.challenges.map((c) => (c.id === id ? { ...c, joined: true } : c)) });
  },
  markNoticeRead(id: string) {
    set({ notices: state.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) });
  },
  markWatched(id: string) {
    set({ videos: state.videos.map((v) => (v.id === id ? { ...v, watched: true } : v)) });
  },
  addSuggestion(title: string, author: string) {
    set({
      suggestions: [
        {
          id: uid(),
          title,
          author,
          byName: state.sessionUser?.name ?? "Staff",
          status: "pending",
        },
        ...state.suggestions,
      ],
    });
  },
  setSuggestionStatus(id: string, status: Suggestion["status"]) {
    set({ suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, status } : s)) });
    logAudit(`suggestion.${status}`, id);
  },
  markNotificationRead(id: string) {
    set({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  },

  // Admin
  addStaff(input: { name: string; email: string; phone: string; departmentId: string }) {
    const user: User = {
      ...input,
      id: uid(),
      role: "staff",
      active: true,
      streak: 0,
      points: 0,
      level: 1,
      language: state.settings.defaultLanguage,
      reminderTime: state.settings.reminderTime,
      joinedAt: demo.iso(new Date()),
      avatarColor: "#6366f1",
    };
    set({ staff: [user, ...state.staff] });
    logAudit("staff.invite", user.name, undefined, "invited");
    return `${typeof window === "undefined" ? "" : window.location.origin}/invite?token=${uid()}${uid()}`;
  },
  toggleStaffActive(id: string) {
    const target = state.staff.find((s) => s.id === id);
    set({ staff: state.staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s)) });
    if (target)
      logAudit(
        target.active ? "staff.deactivate" : "staff.reactivate",
        target.name,
        target.active ? "active" : "inactive",
        target.active ? "inactive" : "active",
      );
  },
  setStaffRole(id: string, role: Role) {
    const target = state.staff.find((s) => s.id === id);
    set({ staff: state.staff.map((s) => (s.id === id ? { ...s, role } : s)) });
    if (target) logAudit("staff.role", target.name, target.role, role);
  },
  saveDepartment(dept: { id?: string; nameEn: string; nameMr: string }) {
    if (dept.id) {
      set({
        departments: state.departments.map((d) =>
          d.id === dept.id ? { ...d, nameEn: dept.nameEn, nameMr: dept.nameMr } : d,
        ),
      });
      logAudit("department.update", dept.nameEn);
    } else {
      set({
        departments: [...state.departments, { id: uid(), ...dept, staffCount: 0 }],
      });
      logAudit("department.create", dept.nameEn);
    }
  },
  deleteDepartment(id: string) {
    const d = state.departments.find((x) => x.id === id);
    set({ departments: state.departments.filter((x) => x.id !== id) });
    if (d) logAudit("department.delete", d.nameEn);
  },
  reviewProof(logId: string, outcome: ProofOutcome, reason?: string) {
    const log = state.logs.find((l) => l.id === logId);
    set({
      logs: state.logs.map((l) => (l.id === logId ? { ...l, proofOutcome: outcome } : l)),
    });
    if (log)
      logAudit(
        `proof.${outcome}`,
        `${log.userName} — ${log.bookTitle}${reason ? ` (${reason})` : ""}`,
        "needs_review",
        outcome,
      );
  },
  adjustMissedDay(date: string, target: string) {
    set({ dayStates: { ...state.dayStates, [date]: "logged" } });
    logAudit("reading.manual_adjust", `${target} — ${date}`, "missed", "logged");
  },
  addNotice(notice: Omit<Notice, "id" | "read" | "publishedAt">) {
    set({
      notices: [
        { ...notice, id: uid(), read: false, publishedAt: demo.iso(new Date()) },
        ...state.notices,
      ],
    });
    logAudit("notice.publish", notice.titleEn);
  },
  addPost(post: Omit<Post, "id" | "publishedAt" | "authorName">) {
    set({
      posts: [
        {
          ...post,
          id: uid(),
          authorName: state.adminUser?.name ?? "Admin",
          publishedAt: demo.iso(new Date()),
        },
        ...state.posts,
      ],
    });
    logAudit("post.publish", post.bodyEn.slice(0, 40));
  },
  addVideo(video: Omit<Video, "id" | "watched">) {
    set({ videos: [{ ...video, id: uid(), watched: false }, ...state.videos] });
    logAudit("video.create", video.titleEn);
  },
  pinTip(id: string) {
    set({ videos: state.videos.map((v) => ({ ...v, pinnedTip: v.id === id })) });
    logAudit("video.pin_ai_tip", id);
  },
  saveChallenge(challenge: Omit<Challenge, "id" | "progress" | "joined">) {
    set({
      challenges: [...state.challenges, { ...challenge, id: uid(), progress: 0, joined: false }],
    });
    logAudit("challenge.create", challenge.titleEn);
  },
  addHoliday(entry: Omit<HolidayEntry, "id">) {
    set({ holidays: [...state.holidays, { ...entry, id: uid() }] });
    logAudit(`calendar.${entry.type}`, entry.labelEn);
  },
  removeHoliday(id: string) {
    set({ holidays: state.holidays.filter((h) => h.id !== id) });
    logAudit("calendar.delete", id);
  },
  updateSettings(patch: Partial<Settings>) {
    const before = state.settings;
    set({ settings: { ...before, ...patch } });
    Object.entries(patch).forEach(([k, v]) =>
      logAudit("settings.update", k, String(before[k as keyof Settings]), String(v)),
    );
  },
  createAdmin(input: { name: string; email: string; departmentId: string }) {
    const user: User = {
      ...input,
      phone: "",
      id: uid(),
      role: "admin",
      active: true,
      streak: 0,
      points: 0,
      level: 1,
      language: state.settings.defaultLanguage,
      reminderTime: state.settings.reminderTime,
      joinedAt: demo.iso(new Date()),
      avatarColor: "#F59E0B",
    };
    set({ staff: [user, ...state.staff] });
    logAudit("admin.create", user.name, undefined, "admin");
  },
  hydrate() {
    if (typeof window === "undefined") return;
    const lang = localStorage.getItem("bc.lang") as Language | null;
    const theme = localStorage.getItem("bc.theme") as "light" | "dark" | null;
    if (lang) set({ language: lang });
    if (theme) {
      set({ theme });
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },
};

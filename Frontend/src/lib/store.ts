import { useSyncExternalStore } from "react";
import * as demo from "./demo-data";
import { api, tokenStore } from "./api";
import { testConnection } from "./firebase";
import {
  seedFirestoreIfEmpty,
  subscribeToFirestore,
  fsSaveReadingLog,
  fsSaveBook,
  fsUpdateBook,
  fsSaveNotice,
  fsSavePost,
  fsSaveVideo,
  fsSaveChallenge,
  fsUpdateChallenge,
  fsSaveSuggestion,
  fsUpdateSuggestion,
  fsSaveHoliday,
  fsDeleteHoliday,
  fsUpdateSettings,
  fsSaveUser,
  fsUpdateUser,
  fsSaveDepartment,
  fsDeleteDepartment,
  fsUpdateReadingLog,
  fsSaveTakeaway,
} from "./firebase-service";
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
  WeeklyTakeaway,
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
  takeaways: WeeklyTakeaway[];
}

export function normalizeUser(raw: any): User {
  if (!raw) return demo.currentUser;
  return {
    id: String(raw.id || raw._id || ""),
    name: raw.name || "Member",
    email: raw.email || "",
    phone: raw.phone || "",
    role: raw.role || "staff",
    departmentId: String(raw.departmentId?._id || raw.departmentId || "d1"),
    active: raw.active !== false,
    streak: raw.currentStreak ?? raw.streak ?? 0,
    points: raw.points ?? 0,
    level:
      typeof raw.level === "number" ? raw.level : raw.points ? Math.floor(raw.points / 100) + 1 : 1,
    language: raw.language === "en" ? "en" : "mr",
    reminderTime: raw.reminderTime || "20:00",
    joinedAt: raw.createdAt
      ? new Date(raw.createdAt).toISOString().slice(0, 10)
      : demo.iso(new Date()),
    avatarColor: raw.avatarColor || "#6366f1",
  };
}

const initial: AppState = {
  language: "mr",
  theme: "light",
  sessionUser: demo.currentUser,
  adminUser: demo.adminUser,
  adminAuthed: true,
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

let hydratingPromise: Promise<void> | null = null;

export const actions = {
  setLanguage(language: Language) {
    set({ language });
    if (typeof window !== "undefined") localStorage.setItem("bc.lang", language);
    if (tokenStore.access()) {
      api.patch("/me/profile", { language }).catch(() => {});
    }
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
    if (tokenStore.access()) {
      api.patch("/me/profile", { reminderTime: time }).catch(() => {});
    }
  },
  login(user?: any) {
    const normalized = user ? normalizeUser(user) : demo.currentUser;
    set({ sessionUser: normalized });
    if (normalized.role === "admin" || normalized.role === "owner") {
      set({ adminAuthed: true, adminUser: normalized });
    }
  },
  logout() {
    if (tokenStore.refresh()) {
      api.post("/auth/logout", { refreshToken: tokenStore.refresh() }).catch(() => {});
    }
    tokenStore.clear();
    set({ sessionUser: null, adminAuthed: false, adminUser: null });
  },
  adminLogin(user?: any) {
    const normalized = user ? normalizeUser(user) : demo.adminUser;
    set({ adminAuthed: true, adminUser: normalized });
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
      ...(input.proof
        ? { proofUrl: input.proof, proofOutcome: "needs_review" as ProofOutcome }
        : {}),
    };
    const streak = user.streak + (state.todayLogged ? 0 : 1);

    // Optimistic update
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
        c.joined ? { ...c, progress: c.progress + (c.type === "individual_pages" ? pages : 1) } : c,
      ),
    });

    fsSaveReadingLog(log).catch(() => {});

    // Call backend API if authenticated
    if (tokenStore.access()) {
      api
        .post("/reading/check-in", {
          bookId: input.bookId,
          currentPage: input.toPage,
          note: input.note,
        })
        .then(({ data }) => {
          if (data?.currentStreak) {
            set((s) => ({
              sessionUser: s.sessionUser ? { ...s.sessionUser, streak: data.currentStreak } : null,
            }));
          }
        })
        .catch((err) => {
          console.warn("CheckIn API call fell back to local store:", err?.message);
        });
    }
  },

  clearCelebration() {
    set({ lastCelebration: null });
  },

  addBook(book: Omit<Book, "id" | "currentPage" | "coverColor">) {
    const colors = ["#6366f1", "#10B981", "#F59E0B", "#0ea5e9", "#8b5cf6", "#ef4444"];
    const newBook: Book = {
      ...book,
      id: uid(),
      currentPage: 0,
      coverColor: colors[state.books.length % colors.length]!,
      shortRead: book.totalPages < 150,
    };
    set({ books: [...state.books, newBook] });
    fsSaveBook(newBook).catch(() => {});

    if (tokenStore.access()) {
      api
        .post("/me/shelf", {
          bookId: newBook.id,
          status: book.status,
        })
        .catch(() => {});
    }
  },

  setBookStatus(id: string, status: BookStatus) {
    if (
      status === "reading" &&
      state.books.filter((b) => b.status === "reading" && b.id !== id).length >= 3
    ) {
      return false;
    }
    set({ books: state.books.map((b) => (b.id === id ? { ...b, status } : b)) });
    fsUpdateBook(id, { status }).catch(() => {});

    if (tokenStore.access()) {
      api.patch(`/me/shelf/${id}`, { status }).catch(() => {});
    }
    return true;
  },

  rateBook(id: string, rating: number, review: string) {
    set({ books: state.books.map((b) => (b.id === id ? { ...b, rating, review } : b)) });
    if (tokenStore.access()) {
      api.patch(`/me/shelf/${id}`, { rating, review }).catch(() => {});
    }
  },

  joinChallenge(id: string) {
    set({ challenges: state.challenges.map((c) => (c.id === id ? { ...c, joined: true } : c)) });
    if (tokenStore.access()) {
      api.post(`/challenges/${id}/join`).catch(() => {});
    }
  },

  markNoticeRead(id: string) {
    set({ notices: state.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    if (tokenStore.access()) {
      api.post(`/notices/${id}/read`).catch(() => {});
    }
  },

  markWatched(id: string) {
    set({ videos: state.videos.map((v) => (v.id === id ? { ...v, watched: true } : v)) });
    if (tokenStore.access()) {
      api.post(`/videos/${id}/watched`).catch(() => {});
    }
  },

  addSuggestion(title: string, author: string) {
    const newSug = {
      id: uid(),
      title,
      author,
      byName: state.sessionUser?.name ?? "Staff",
      status: "pending" as const,
    };
    set({
      suggestions: [newSug, ...state.suggestions],
    });
    fsSaveSuggestion(newSug).catch(() => {});
    if (tokenStore.access()) {
      api.post("/suggestions/books", { title, author }).catch(() => {});
    }
  },

  setSuggestionStatus(id: string, status: Suggestion["status"]) {
    set({ suggestions: state.suggestions.map((s) => (s.id === id ? { ...s, status } : s)) });
    fsUpdateSuggestion(id, status).catch(() => {});
    logAudit(`suggestion.${status}`, id);
    if (tokenStore.access()) {
      api.patch(`/admin/suggestions/${id}`, { status }).catch(() => {});
    }
  },

  markNotificationRead(id: string) {
    set({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
    if (tokenStore.access()) {
      api.post(`/me/notifications/${id}/read`).catch(() => {});
    }
  },

  // Admin actions
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
    fsSaveUser(user).catch(() => {});
    logAudit("staff.invite", user.name, undefined, "invited");

    if (tokenStore.access()) {
      api.post("/admin/users", input).catch(() => {});
    }
    return `${typeof window === "undefined" ? "" : window.location.origin}/invite?token=${uid()}${uid()}`;
  },

  toggleStaffActive(id: string) {
    const target = state.staff.find((s) => s.id === id);
    const newActive = !target?.active;
    set({ staff: state.staff.map((s) => (s.id === id ? { ...s, active: newActive } : s)) });
    fsUpdateUser(id, { active: newActive }).catch(() => {});
    if (target) {
      logAudit(
        target.active ? "staff.deactivate" : "staff.reactivate",
        target.name,
        target.active ? "active" : "inactive",
        target.active ? "inactive" : "active",
      );
      if (tokenStore.access()) {
        api.post(`/admin/users/${id}/deactivate`).catch(() => {});
      }
    }
  },

  setStaffRole(id: string, role: Role) {
    const target = state.staff.find((s) => s.id === id);
    set({ staff: state.staff.map((s) => (s.id === id ? { ...s, role } : s)) });
    fsUpdateUser(id, { role }).catch(() => {});
    if (target) {
      logAudit("staff.role", target.name, target.role, role);
      if (tokenStore.access()) {
        api.patch(`/admin/users/${id}/role`, { role }).catch(() => {});
      }
    }
  },

  saveDepartment(dept: { id?: string; nameEn: string; nameMr: string }) {
    if (dept.id) {
      const updatedDept = {
        id: dept.id,
        nameEn: dept.nameEn,
        nameMr: dept.nameMr,
        staffCount: state.departments.find((d) => d.id === dept.id)?.staffCount || 0,
      };
      set({
        departments: state.departments.map((d) =>
          d.id === dept.id ? { ...d, nameEn: dept.nameEn, nameMr: dept.nameMr } : d,
        ),
      });
      fsSaveDepartment(updatedDept).catch(() => {});
      logAudit("department.update", dept.nameEn);
      if (tokenStore.access()) {
        api
          .patch(`/admin/departments/${dept.id}`, {
            name: { en: dept.nameEn, mr: dept.nameMr },
          })
          .catch(() => {});
      }
    } else {
      const newDept = { id: uid(), ...dept, staffCount: 0 };
      set({
        departments: [...state.departments, newDept],
      });
      fsSaveDepartment(newDept).catch(() => {});
      logAudit("department.create", dept.nameEn);
      if (tokenStore.access()) {
        api
          .post("/admin/departments", {
            name: { en: dept.nameEn, mr: dept.nameMr },
          })
          .catch(() => {});
      }
    }
  },

  deleteDepartment(id: string) {
    const d = state.departments.find((x) => x.id === id);
    set({ departments: state.departments.filter((x) => x.id !== id) });
    fsDeleteDepartment(id).catch(() => {});
    if (d) {
      logAudit("department.delete", d.nameEn);
      if (tokenStore.access()) {
        api.delete(`/admin/departments/${id}`).catch(() => {});
      }
    }
  },

  reviewProof(logId: string, outcome: ProofOutcome, reason?: string) {
    const log = state.logs.find((l) => l.id === logId);
    set({
      logs: state.logs.map((l) => (l.id === logId ? { ...l, proofOutcome: outcome } : l)),
    });
    fsUpdateReadingLog(logId, { proofOutcome: outcome }).catch(() => {});
    if (log) {
      logAudit(
        `proof.${outcome}`,
        `${log.userName} — ${log.bookTitle}${reason ? ` (${reason})` : ""}`,
        "needs_review",
        outcome,
      );
      if (tokenStore.access()) {
        const decision = outcome === "accepted" ? "accepted" : "rejected";
        api.post(`/admin/proof-reviews/${logId}/decision`, { decision, reason }).catch(() => {});
      }
    }
  },

  adjustMissedDay(date: string, target: string) {
    set({ dayStates: { ...state.dayStates, [date]: "logged" } });
    logAudit("reading.manual_adjust", `${target} — ${date}`, "missed", "logged");
    if (tokenStore.access()) {
      api.post("/admin/reading/add-day", { date, targetUserId: target }).catch(() => {});
    }
  },

  addNotice(notice: Omit<Notice, "id" | "read" | "publishedAt">) {
    const newNotice = { ...notice, id: uid(), read: false, publishedAt: demo.iso(new Date()) };
    set({ notices: [newNotice, ...state.notices] });
    fsSaveNotice(newNotice).catch(() => {});
    logAudit("notice.publish", notice.titleEn);
    if (tokenStore.access()) {
      api
        .post("/admin/notices", {
          title: { en: notice.titleEn, mr: notice.titleMr },
          body: { en: notice.bodyEn, mr: notice.bodyMr },
          priority: notice.priority,
          pinned: notice.pinned,
        })
        .catch(() => {});
    }
  },

  addPost(post: Omit<Post, "id" | "publishedAt" | "authorName">) {
    const newPost = {
      ...post,
      id: uid(),
      authorName: state.adminUser?.name ?? "Admin",
      publishedAt: demo.iso(new Date()),
    };
    set({ posts: [newPost, ...state.posts] });
    fsSavePost(newPost).catch(() => {});
    logAudit("post.publish", post.bodyEn.slice(0, 40));
    if (tokenStore.access()) {
      api
        .post("/admin/posts", {
          body: { en: post.bodyEn, mr: post.bodyMr },
          images: post.images,
        })
        .catch(() => {});
    }
  },

  addVideo(video: Omit<Video, "id" | "watched">) {
    const newVideo = { ...video, id: uid(), watched: false };
    set({ videos: [newVideo, ...state.videos] });
    fsSaveVideo(newVideo).catch(() => {});
    logAudit("video.create", video.titleEn);
    if (tokenStore.access()) {
      api
        .post("/admin/videos", {
          youtubeUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
          category: video.category,
          language: video.language,
          description: { en: video.titleEn, mr: video.titleMr },
        })
        .catch(() => {});
    }
  },

  pinTip(id: string) {
    set({ videos: state.videos.map((v) => ({ ...v, pinnedTip: v.id === id })) });
    logAudit("video.pin_ai_tip", id);
    if (tokenStore.access()) {
      api.patch(`/admin/videos/${id}`, { pinnedTip: true }).catch(() => {});
    }
  },

  saveChallenge(challenge: Omit<Challenge, "id" | "progress" | "joined">) {
    const newChallenge = { ...challenge, id: uid(), progress: 0, joined: false };
    set({
      challenges: [...state.challenges, newChallenge],
    });
    fsSaveChallenge(newChallenge).catch(() => {});
    logAudit("challenge.create", challenge.titleEn);
    if (tokenStore.access()) {
      api
        .post("/admin/challenges", {
          title: { en: challenge.titleEn, mr: challenge.titleMr },
          description: { en: challenge.titleEn, mr: challenge.titleMr },
          target: challenge.target,
          type: challenge.type,
          startDate: new Date().toISOString(),
          endDate: new Date(challenge.endsOn).toISOString(),
          rewardPoints: challenge.rewardPoints,
        })
        .catch(() => {});
    }
  },

  addHoliday(entry: Omit<HolidayEntry, "id">) {
    const newHoliday = { ...entry, id: uid() };
    set({ holidays: [...state.holidays, newHoliday] });
    fsSaveHoliday(newHoliday).catch(() => {});
    logAudit(`calendar.${entry.type}`, entry.labelEn);
    if (tokenStore.access()) {
      api
        .post("/admin/holidays", {
          date: entry.date,
          name: { en: entry.labelEn, mr: entry.labelMr },
          type: entry.type,
        })
        .catch(() => {});
    }
  },

  removeHoliday(id: string) {
    set({ holidays: state.holidays.filter((h) => h.id !== id) });
    fsDeleteHoliday(id).catch(() => {});
    logAudit("calendar.delete", id);
    if (tokenStore.access()) {
      api.delete(`/admin/holidays/${id}`).catch(() => {});
    }
  },

  updateSettings(patch: Partial<Settings>) {
    const before = state.settings;
    set({ settings: { ...before, ...patch } });
    fsUpdateSettings(patch).catch(() => {});
    Object.entries(patch).forEach(([k, v]) =>
      logAudit("settings.update", k, String(before[k as keyof Settings]), String(v)),
    );
    if (tokenStore.access()) {
      api.patch("/admin/settings", patch).catch(() => {});
    }
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
    fsSaveUser(user).catch(() => {});
    logAudit("admin.create", user.name, undefined, "admin");
    if (tokenStore.access()) {
      api.post("/owner/admins", input).catch(() => {});
    }
  },

  async hydrate() {
    if (typeof window === "undefined") return;
    if (hydratingPromise) return hydratingPromise;

    hydratingPromise = (async () => {
      const lang = localStorage.getItem("bc.lang") as Language | null;
      const theme = localStorage.getItem("bc.theme") as "light" | "dark" | null;
      if (lang) set({ language: lang });
      if (theme) {
        set({ theme });
        document.documentElement.classList.toggle("dark", theme === "dark");
      }

      // Initialize Firestore connection, seed data if empty, and subscribe to real-time updates
      void testConnection();
      void seedFirestoreIfEmpty();
      subscribeToFirestore((partial) => set(partial));

      // If access token exists, fetch profile and data to hydrate session
      if (tokenStore.access()) {
        try {
          const { data } = await api.get("/me/profile");
          if (data?.user) {
            const normalized = normalizeUser(data.user);
            if (data.displayStreak !== undefined) {
              normalized.streak = data.displayStreak;
            }
            set({ sessionUser: normalized });
            if (normalized.role === "admin" || normalized.role === "owner") {
              set({ adminAuthed: true, adminUser: normalized });
            }
          }

          // Fetch user shelf
          try {
            const shelfRes = await api.get("/me/shelf");
            if (Array.isArray(shelfRes.data) && shelfRes.data.length > 0) {
              const colors = ["#6366f1", "#10B981", "#F59E0B", "#0ea5e9", "#8b5cf6", "#ef4444"];
              const mappedBooks: Book[] = shelfRes.data.map((ub: any, idx: number) => ({
                id: String(ub.bookId?._id || ub.bookId || ub._id),
                title: ub.bookId?.title || "Book",
                author: ub.bookId?.author || "Author",
                totalPages: ub.bookId?.totalPages || 100,
                language: ub.bookId?.language || "mr",
                status: ub.status || "want_to_read",
                currentPage: ub.currentPage || 0,
                coverColor: colors[idx % colors.length]!,
                rating: ub.rating,
                review: ub.review,
              }));
              set({ books: mappedBooks });
            }
          } catch {}

          // If admin/owner, fetch admin collections
          if (state.adminAuthed) {
            try {
              const [usersRes, deptsRes, settingsRes] = await Promise.allSettled([
                api.get("/admin/users"),
                api.get("/admin/departments"),
                api.get("/admin/settings"),
              ]);
              if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value.data)) {
                set({ staff: usersRes.value.data.map(normalizeUser) });
              }
              if (deptsRes.status === "fulfilled" && Array.isArray(deptsRes.value.data)) {
                set({
                  departments: deptsRes.value.data.map((d: any) => ({
                    id: String(d._id || d.id),
                    nameEn: d.name?.en || d.nameEn || "",
                    nameMr: d.name?.mr || d.nameMr || "",
                    staffCount: d.staffCount || 0,
                  })),
                });
              }
              if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
                set({ settings: { ...demo.settings, ...settingsRes.value.data } });
              }
            } catch {}
          }
        } catch (err: any) {
          console.warn("Hydrate error:", err?.message);
          if (err?.response?.status === 401) {
            tokenStore.clear();
            set({ sessionUser: null, adminAuthed: false, adminUser: null });
          }
        }
      } else {
        // No token stored, ensure sessionUser is null
        set({ sessionUser: null });
      }
    })().finally(() => {
      hydratingPromise = null;
    });

    return hydratingPromise;
  },
};

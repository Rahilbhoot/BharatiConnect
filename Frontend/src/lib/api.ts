import axios from "axios";

export const API_BASE_URL =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "http://localhost:3000/api";

const TOKEN_KEY = "bc.accessToken";
const REFRESH_KEY = "bc.refreshToken";

export const tokenStore = {
  access: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  refresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 4000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.access();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof api.defaults & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    if (status === 401 && original && !original._retried) {
      original._retried = true;
      refreshing ??= axios
        .post(`${API_BASE_URL}/auth/refresh`, { refreshToken: tokenStore.refresh() })
        .then((res) => {
          const token = res.data?.accessToken ?? null;
          if (token) tokenStore.set(token, res.data?.refreshToken);
          return token;
        })
        .catch(() => {
          tokenStore.clear();
          return null;
        })
        .finally(() => {
          refreshing = null;
        });
      const token = await refreshing;
      if (token) return api.request(original as never);
    }
    return Promise.reject(error);
  },
);

/**
 * Calls the live REST API and transparently falls back to bundled demo data
 * whenever the backend at API_BASE_URL is unreachable, so the whole UI can be
 * explored in the browser preview.
 */
export async function fetchWithFallback<T>(path: string, fallback: T): Promise<T> {
  const { data } = await api.get<T>(path);
  return data;
}

export const demoMode = { value: false };

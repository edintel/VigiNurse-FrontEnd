import axios from "axios";
import { API_BASE_URL } from "@/config/api";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
// Normaliza autenticacion token.
function normalizeAuthToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let token = raw.trim();
  if (!token) return null;
  token = token.replace(/^Bearer\s+/i, "").trim();
  token = token.replace(/^['"]+|['"]+$/g, "").trim();
  return token || null;
}
// Valida inicio de sesion
function isLoginRequest(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false;
  try {
    const parsed = new URL(url, API_BASE_URL);
    return parsed.pathname.endsWith("/auth/login");
  } catch {
    return url.includes("/auth/login");
  }
}

// Interceptors para agregar token a las solicitudes y manejar errores de autenticación.
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("hospital_auth");
        if (raw) {
          const { token } = JSON.parse(raw) as {
            token?: unknown;
          };
          const normalizedToken = normalizeAuthToken(token);
          if (normalizedToken) {
            config.headers.Authorization = `Bearer ${normalizedToken}`;
          }
        }
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor para manejar errores de autenticación globalmente.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const status = (
      error as {
        response?: {
          status?: number;
        };
      }
    )?.response?.status;
    const requestUrl = (
      error as {
        config?: {
          url?: unknown;
        };
      }
    )?.config?.url;
    const isAuthLoginRequest = isLoginRequest(requestUrl);
    if (
      status === 401 &&
      !isAuthLoginRequest &&
      typeof window !== "undefined"
    ) {
      const [{ store }, { logout }, { clearSession }] = await Promise.all([
        import("@/store/store"),
        import("@/store/slices/authSlice"),
        import("@/lib/session"),
      ]);
      store.dispatch(logout());
      clearSession();
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);
export default axiosInstance;

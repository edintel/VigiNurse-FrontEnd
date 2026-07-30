import axios from "axios";
import { API_BASE_URL } from "@/config/api";

// withCredentials hace que el navegador envie la cookie de sesion httpOnly en cada
// peticion. Ya no se lee ningun token desde localStorage ni se arma el header
// Authorization a mano: el JWT es inaccesible para el JavaScript de la pagina.
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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

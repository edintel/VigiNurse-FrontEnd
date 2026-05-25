import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  BackendLoginApiResponse,
  LoginCredentials,
  LoginResult,
  LoginSuccessResponse,
} from "@/features/authentication/types";
// Valida si un valor es un objeto record.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
// Normaliza token.
function normalizeToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let token = raw.trim();
  if (!token) return null;
  token = token.replace(/^Bearer\s+/i, "").trim();
  token = token.replace(/^['"]+|['"]+$/g, "").trim();
  return token || null;
}
// Normaliza rol.
function normalizeRole(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "PACIENTE";
  const role = raw
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (role === "SUPERADMIN" || role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (role === "ADMINISTRADOR" || role === "ADMIN") return "ADMIN";
  if (role === "SUPERVISOR") return "SUPERVISOR";
  if (role === "ENFERMERO" || role === "ENFERMERA") return "ENFERMERO";
  if (role === "TECNICO" || role === "TECNICA") return "TECNICO";
  if (role === "GESTOR" || role === "GESTORA") return "GESTOR";
  if (role === "RECEPCIONISTA") return "RECEPCIONISTA";
  if (role === "AUDITOR" || role === "AUDITORA") return "AUDITOR";
  if (
    role === "MEDICO" ||
    role === "MEDICA" ||
    role === "DOCTOR" ||
    role === "DOCTORA"
  )
    return "DOCTOR";
  if (role === "PACIENTE") return "PACIENTE";
  return role;
}
// Normaliza la respuesta de login.
function normalizeLoginResponse(payload: unknown): LoginSuccessResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid login response");
  }
  const token = normalizeToken(payload.token);
  if (!token) throw new Error("Invalid login response");
  if (isRecord(payload.user)) {
    const user = payload.user;
    if (
      (typeof user.id === "string" || typeof user.id === "number") &&
      typeof user.email === "string" &&
      typeof user.name === "string" &&
      typeof user.role === "string"
    ) {
      return {
        token,
        user: {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: normalizeRole(user.role),
        },
      };
    }
  }
  if (isRecord(payload.usuario)) {
    const usuario = payload.usuario;
    const firstRole = Array.isArray(usuario.roles)
      ? usuario.roles[0]
      : undefined;
    if (
      (typeof usuario.id === "string" || typeof usuario.id === "number") &&
      typeof usuario.email === "string" &&
      typeof usuario.nombreCompleto === "string"
    ) {
      return {
        token,
        expiracion:
          typeof payload.expiracion === "string"
            ? payload.expiracion
            : undefined,
        user: {
          id: String(usuario.id),
          email: usuario.email,
          name: usuario.nombreCompleto,
          role: normalizeRole(firstRole),
        },
      };
    }
  }
  throw new Error("Invalid login response");
}
// Extrae mensaje de error del backend.
function extractBackendErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.mensaje === "string" && payload.mensaje.trim()) {
    return payload.mensaje;
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return null;
}
// Solicita recuperación de contraseña.
export async function requestPasswordRecovery(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await axiosInstance.post(API_ENDPOINTS.auth.requestRecovery, { email });
    return { success: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      isRecord(
        (
          error as {
            response: unknown;
          }
        ).response,
      )
    ) {
      const responseData = (
        error as {
          response: {
            data?: unknown;
          };
        }
      ).response.data;
      const backendMessage = extractBackendErrorMessage(responseData);
      return {
        success: false,
        error: backendMessage ?? "No se pudo enviar el correo de recuperación.",
      };
    }
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}
// Valida el token de restablecimiento de contraseña.
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    await axiosInstance.get(API_ENDPOINTS.auth.validateToken, {
      params: { token },
    });
    return { valid: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      isRecord(
        (
          error as {
            response: unknown;
          }
        ).response,
      )
    ) {
      const responseData = (
        error as {
          response: {
            data?: unknown;
          };
        }
      ).response.data;
      const backendMessage = extractBackendErrorMessage(responseData);
      return {
        valid: false,
        error: backendMessage ?? "El enlace ha expirado o no es válido.",
      };
    }
    return { valid: false, error: "No se pudo conectar con el servidor." };
  }
}
// Ejecuta la logica de restablecimiento de contraseña.
export async function resetPassword(
  token: string,
  nuevoPassword: string,
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await axiosInstance.post(API_ENDPOINTS.auth.resetPassword, {
      token,
      nuevoPassword,
    });
    return { success: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      isRecord(
        (
          error as {
            response: unknown;
          }
        ).response,
      )
    ) {
      const responseData = (
        error as {
          response: {
            data?: unknown;
          };
        }
      ).response.data;
      const backendMessage = extractBackendErrorMessage(responseData);
      return {
        success: false,
        error: backendMessage ?? "No se pudo restablecer la contraseña.",
      };
    }
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}
// Ejecuta la logica de inicio de sesion.
export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  try {
    const response = await axiosInstance.post<BackendLoginApiResponse>(
      API_ENDPOINTS.auth.login,
      credentials,
    );
    return { success: true, data: normalizeLoginResponse(response.data) };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid login response") {
      return { success: false, error: "Respuesta de autenticación inválida." };
    }
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      isRecord(
        (
          error as {
            response: unknown;
          }
        ).response,
      )
    ) {
      const responseData = (
        error as {
          response: {
            data?: unknown;
          };
        }
      ).response.data;
      const backendMessage = extractBackendErrorMessage(responseData);
      return {
        success: false,
        error: backendMessage ?? "Credenciales incorrectas.",
      };
    }
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}

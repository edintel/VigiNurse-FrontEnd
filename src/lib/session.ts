import type { PersistedSession } from "@/types";
const SESSION_KEY = "hospital_auth";

function hospitalIdFromJwt(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const raw = payload["hospital_id"];
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") return parseInt(raw, 10) || null;
    return null;
  } catch {
    return null;
  }
}

// Ejecuta la logica para guardar datos de sesion.
export function saveSession(data: PersistedSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}
// Obtiene datos de sesion.
export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PersistedSession;
    if (!session.user.hospitalId && session.token) {
      session.user.hospitalId = hospitalIdFromJwt(session.token);
    }
    return session;
  } catch {
    return null;
  }
}
// Ejecuta la logica para limpiar datos de sesion.
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

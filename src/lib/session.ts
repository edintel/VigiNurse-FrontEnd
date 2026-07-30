import type { PersistedSession } from "@/types";
const SESSION_KEY = "hospital_auth";

// El JWT NO se guarda aqui: viaja en una cookie httpOnly que el navegador adjunta
// automaticamente y que el JavaScript no puede leer. En localStorage solo queda el
// perfil no sensible (nombre, rol, permisos) para rehidratar la interfaz al recargar.

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
    return JSON.parse(raw) as PersistedSession;
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

import type { TurnoPersonal } from "@/features/staff-monitoring/types";

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

// El servidor envía strings de fecha en hora local sin indicador de zona horaria.
// new Date(isoString) puede interpretarlos como UTC en algunos entornos, provocando
// que un turno que empieza a las 15:00 local aparezca "en curso" al mediodía.
// El constructor multi-argumento new Date(y, m, d, h, min, sec) siempre usa hora local.
export function parseLocalIso(iso: string): number {
  const [datePart = "", timePart = ""] = iso.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h = "0", min = "0", secRaw = "0"] = timePart.split(":");
  // parseFloat ignora Z, +HH:mm, -HH:mm que puedan seguir al segundo
  return new Date(
    y,
    mo - 1,
    d,
    Number(h),
    Number(min),
    parseFloat(secRaw) || 0,
  ).getTime();
}

export function findCurrentAndNextShift(turnos: TurnoPersonal[]): {
  current: TurnoPersonal | null;
  next: TurnoPersonal | null;
} {
  const now = Date.now();
  let current: TurnoPersonal | null = null;
  let next: TurnoPersonal | null = null;
  for (const t of turnos) {
    const start = parseLocalIso(t.fechaInicio);
    const end = parseLocalIso(t.fechaFin);
    if (now >= start && now <= end) {
      current = t;
    } else if (start > now && (!next || start < parseLocalIso(next.fechaInicio))) {
      next = t;
    }
  }
  return { current, next };
}

export function fmtShiftTime(t: TurnoPersonal): string {
  return `${t.fechaInicio.slice(11, 16)} — ${t.fechaFin.slice(11, 16)}`;
}

export function isTodayIso(iso: string): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return iso.slice(0, 10) === today;
}

export function fmtShiftDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function getTodayRange() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fechaDesde = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fut = new Date(d);
  fut.setDate(d.getDate() + 7);
  const fechaHasta = `${fut.getFullYear()}-${pad(fut.getMonth() + 1)}-${pad(fut.getDate())}`;
  return { fechaDesde, fechaHasta };
}

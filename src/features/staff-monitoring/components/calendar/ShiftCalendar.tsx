"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/lib/toast";
import { getShifts, deleteShift } from "../../services/shiftsService";
import { getAreas } from "../../services/areasService";
import type { TurnoPersonal, Area } from "../../types";
import { TipoTurno } from "../../types";

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];



function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

function fmtHora(iso: string): string { return iso.slice(11, 16); }
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}
function getShiftLabel(horaInicio: string): string {
  const h = parseInt(horaInicio.slice(0, 2), 10);
  if (h >= 6 && h < 14) return "Mañana";
  if (h >= 14 && h < 20) return "Tarde";
  return "Noche";
}


interface TurnoGrupo {
  key: string;       // groupKey-tipoTurno-horaInicio (único por día)
  fechaKey: string;  // YYYY-MM-DD
  areaId: number;
  nombreArea: string;
  nombreGrupo: string | null;
  tipoTurno: TipoTurno;
  horaInicio: string;  // HH:MM (del slice del ISO UTC)
  horaFin: string;
  personas: TurnoPersonal[];
}

// Agrupa los turnos por fecha y luego por ciclo de asignación (o por área+tipo+hora si no hay ciclo), 
// para mostrarlos como groups en el calendar.
function groupShiftsByDate(turnos: TurnoPersonal[]): Record<string, TurnoGrupo[]> {
  const map: Record<string, Record<string, TurnoGrupo>> = {};
  for (const t of turnos) {
    const fechaKey = t.fechaInicio.slice(0, 10);
    const horaInicio = t.fechaInicio.slice(11, 16);
    const horaFin = t.fechaFin.slice(11, 16);
    
    const groupKey = t.grupoCicloAsignacionId != null
      ? `asig-${t.grupoCicloAsignacionId}-${horaInicio}`
      : `${t.areaId}-${t.tipoTurno}-${horaInicio}`;
    if (!map[fechaKey]) map[fechaKey] = {};
    if (!map[fechaKey][groupKey]) {
      map[fechaKey][groupKey] = {
        key: groupKey, fechaKey, areaId: t.areaId, nombreArea: t.nombreArea,
        nombreGrupo: t.nombreGrupo ?? null,
        tipoTurno: t.tipoTurno, horaInicio, horaFin, personas: [],
      };
    }
    map[fechaKey][groupKey].personas.push(t);
  }
  const result: Record<string, TurnoGrupo[]> = {};
  for (const [fechaKey, gs] of Object.entries(map)) {
    result[fechaKey] = Object.values(gs).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }
  return result;
}

function getGroupColors(g: TurnoGrupo): { bg: string; text: string; border: string } {
  if (g.tipoTurno === TipoTurno.Guardia) return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
  const h = parseInt(g.horaInicio.slice(0, 2), 10);
  if (h >= 6 && h < 14) return { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" };
  if (h >= 14 && h < 20) return { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" };
  return { bg: "#eef2ff", text: "#4f46e5", border: "#c7d2fe" };
}



const POPOVER_W = 288;   // w-72
const POPOVER_MAX_H = 380;
const GAP = 6;

interface GrupoPopoverProps {
  grupo: TurnoGrupo;
  anchorRect: DOMRect;
  onDeleteTurno: (t: TurnoPersonal) => void;
  onClose: () => void;
  allowDelete?: boolean;
}

// Popover que muestra los detalles de un grupo de turnos al hacer click en el chip del calendar, con opción de eliminar turnos si allowDelete es true.
function GroupPopover({ grupo, anchorRect, onDeleteTurno, onClose, allowDelete = true }: GrupoPopoverProps) {
  const colors = getGroupColors(grupo);
  const label = grupo.tipoTurno === TipoTurno.Guardia ? "Guardia" : getShiftLabel(grupo.horaInicio);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!popoverRef.current) return;
    const h = popoverRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const showBelow = spaceBelow >= h + GAP;
    const top = showBelow
      ? anchorRect.bottom + GAP
      : Math.max(GAP, anchorRect.top - GAP - h);
    let left = anchorRect.left + anchorRect.width / 2 - POPOVER_W / 2;
    left = Math.max(GAP, Math.min(left, window.innerWidth - POPOVER_W - GAP));
    setPos({ top, left });
  }, [anchorRect]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        ref={popoverRef}
        className="fixed z-[999] bg-white rounded-xl shadow-xl border border-[#e2e8f0] w-72 overflow-hidden"
        style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: -9999, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
      <div
        className="px-4 py-3 border-b border-[#f1f5f9] flex items-start justify-between"
        style={{ borderTop: `3px solid ${colors.text}` }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#0f172a] truncate">{grupo.nombreGrupo ?? grupo.nombreArea}</p>
          <p className="text-[10px] text-slate-400 truncate">{grupo.nombreArea}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {grupo.horaInicio}–{grupo.horaFin}{" "}·{" "}
            <span className="font-semibold" style={{ color: colors.text }}>{label}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold border"
            style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
          >
            {grupo.personas.length}p
          </span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {grupo.personas.map((t) => {
          const initials = (t.nombreUsuario?.[0] ?? "?").toUpperCase();
          return (
            <div
              key={t.id}
              className="flex items-center gap-2.5 px-4 py-2 border-b border-[#f8fafc] last:border-b-0 hover:bg-[#f8fafc] group/row transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#09268E]/10 text-[#09268E] flex items-center justify-center text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0f172a] truncate">{t.nombreUsuario}</p>
              </div>
              {allowDelete && (
                <button
                  type="button"
                  title="Eliminar turno"
                  onClick={() => onDeleteTurno(t)}
                  className="p-1 rounded text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover/row:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>,
    document.body
  );
}



interface CalendarioTurnosProps {
  usuarioId?: number;
  showAreaFilter?: boolean;
  allowDelete?: boolean;
  initialView?: "mensual" | "semanal";
}

// Componente principal del calendar de turnos, con vista mensual y semanal, 
// filtrado por área, y opción de eliminar turnos desde el popover.
export function ShiftCalendar({ usuarioId, showAreaFilter = true, allowDelete = true, initialView = "mensual" }: CalendarioTurnosProps = {}) {
  const now = new Date();
  const [vista, setVista] = useState<"mensual" | "semanal">(initialView);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(now);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [turnos, setTurnos] = useState<TurnoPersonal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filterArea, setFilterArea] = useState(0);

  const [activeGrupo, setActiveGrupo] = useState<{ fechaKey: string; key: string; rect: DOMRect } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TurnoPersonal | null>(null);
  const [deleting, setDeleting] = useState(false);

  function getDateRange() {
    if (vista === "mensual") {
      return {
        desde: new Date(year, month, 1).toISOString().slice(0, 10),
        hasta: new Date(year, month + 1, 0).toISOString().slice(0, 10),
      };
    }
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return {
      desde: weekStart.toISOString().slice(0, 10),
      hasta: end.toISOString().slice(0, 10),
    };
  }

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { desde, hasta } = getDateRange();
    try {
      const result = await getShifts(1, 500, {
        fechaDesde: desde,
        fechaHasta: hasta,
        ...(usuarioId !== undefined ? { usuarioId } : {}),
        ...(filterArea ? { areaId: filterArea } : {}),
      });
      setTurnos(result.datos);
    } catch {
      setError("No se pudieron cargar los turnos.");
    } finally {
      setLoading(false);
    }
 
  }, [vista, year, month, weekStart, filterArea, usuarioId]);

  useEffect(() => {
    void fetchShifts();
    if (showAreaFilter) {
      getAreas().then(setAreas).catch(() => setAreas([]));
    }
  }, [fetchShifts, showAreaFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShift(deleteTarget.id);
      toast.success("Turno eliminado.");
      setTurnos((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      setActiveGrupo(null);
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo eliminar el turno."));
    } finally {
      setDeleting(false);
    }
  }

  function prevPeriod() {
    setActiveGrupo(null);
    if (vista === "mensual") {
      if (month === 0) { setYear((y) => y - 1); setMonth(11); }
      else setMonth((m) => m - 1);
    } else {
      setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    }
  }

  function nextPeriod() {
    setActiveGrupo(null);
    if (vista === "mensual") {
      if (month === 11) { setYear((y) => y + 1); setMonth(0); }
      else setMonth((m) => m + 1);
    } else {
      setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    }
  }

  const byDateGrouped = useMemo(() => groupShiftsByDate(turnos), [turnos]);


  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalRows = Math.ceil((startOffset + daysInMonth) / 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const periodLabel = vista === "mensual"
    ? `${MONTH_NAMES[month]} ${year}`
    : `${weekDays[0].toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} – ${weekDays[6].toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}`;

  // Renderiza el chip de un grupo de turnos en el calendar, con colores según el tipo de turno, y al hacer click muestra el popover con detalles.
  function renderGroupChip(g: TurnoGrupo, compact = false) {
    const colors = getGroupColors(g);
    const isActive = activeGrupo?.fechaKey === g.fechaKey && activeGrupo?.key === g.key;
    const label = g.tipoTurno === TipoTurno.Guardia ? "Guardia" : getShiftLabel(g.horaInicio);

    return (
      <div key={g.key}>
        <div
          className="rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer border transition-opacity hover:opacity-80 truncate"
          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
          onClick={(e) => {
            e.stopPropagation();
            if (isActive) { setActiveGrupo(null); return; }
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setActiveGrupo({ fechaKey: g.fechaKey, key: g.key, rect });
          }}
        >
          {compact ? (
            <>{g.nombreGrupo ?? g.nombreArea} · {g.personas.length}p</>
          ) : (
            <>{g.horaInicio} · {g.nombreGrupo ?? g.nombreArea} · <span className="font-bold">{g.personas.length}p</span> · {label}</>
          )}
        </div>
      </div>
    );
  }

  const totalTurnos = turnos.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-0.5">
          {(["mensual", "semanal"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setVista(v); setActiveGrupo(null); }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${vista === v ? "bg-white shadow text-[#09268E]" : "text-slate-500"}`}
            >
              {v === "mensual" ? "Mensual" : "Semanal"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={prevPeriod} className="btn btn-ghost btn-sm btn-square text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-bold text-[#1A2B5E] min-w-[180px] text-center">{periodLabel}</span>
          <button type="button" onClick={nextPeriod} className="btn btn-ghost btn-sm btn-square text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {showAreaFilter && (
          <select
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] cursor-pointer"
            value={filterArea}
            onChange={(e) => setFilterArea(Number(e.target.value))}
          >
            <option value={0}>Todas las áreas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void fetchShifts()}>Reintentar</button>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-4">
          <p className="flex-1 text-sm text-red-700">
            ¿Eliminar el turno de <strong>{deleteTarget.nombreUsuario}</strong> del {fmtDate(deleteTarget.fechaInicio)}?
          </p>
          <button className="btn btn-xs btn-ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="btn btn-xs btn-error text-white border-none" disabled={deleting} onClick={() => void handleDelete()}>
            {deleting && <span className="loading loading-spinner loading-xs" />}
            Eliminar
          </button>
        </div>
      )}

      {/* Calendar card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-[#f1f5f9] bg-[#f8fafc]">
          {(vista === "semanal" ? weekDays : DAY_NAMES).map((item, i) => {
            if (vista === "semanal") {
              const d = item as Date;
              const isToday = d.toDateString() === now.toDateString();
              return (
                <div key={i} className={`text-center py-2.5 px-1 ${isToday ? "text-[#09268E]" : "text-slate-400"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide">{DAY_NAMES[i]}</p>
                  <p className={`text-lg font-extrabold mt-0.5 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${isToday ? "bg-[#09268E] text-white" : ""}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            }
            return (
              <div key={i} className="text-center py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {item as string}
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-md text-[#09268E]" />
          </div>

        ) : vista === "mensual" ? (
          // ── Vista mensual ────────────────────────────────────────────────
          <div className="grid grid-cols-7">
            {Array.from({ length: totalRows * 7 }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
              if (!isValid) {
                return <div key={i} className="min-h-[100px] border-b border-r border-[#f1f5f9] last-of-type:border-r-0 bg-[#fafafa]" />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const groups = byDateGrouped[dateKey] ?? [];
              const isToday = year === now.getFullYear() && month === now.getMonth() && dayNum === now.getDate();
              const colIdx = i % 7;

              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-1.5 border-b border-r border-[#f1f5f9] ${colIdx === 6 ? "border-r-0" : ""} ${i >= (totalRows - 1) * 7 ? "border-b-0" : ""} ${isToday ? "bg-[#09268E]/3" : "hover:bg-[#f8fafc]"} transition-colors`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1.5 ${isToday ? "bg-[#09268E] text-white" : "text-slate-600"}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {groups.slice(0, 3).map((g) => renderGroupChip(g, true))}
                    {groups.length > 3 && (
                      <p className="text-[10px] text-slate-400 pl-1">+{groups.length - 3} groups</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          // ── Vista semanal (scrollable) ───────────────────────────────────
          <div className="grid grid-cols-7 max-h-[560px] overflow-y-auto">
            {weekDays.map((d, i) => {
              const dateKey = d.toISOString().slice(0, 10);
              const groups = byDateGrouped[dateKey] ?? [];
              const isToday = d.toDateString() === now.toDateString();

              return (
                <div
                  key={i}
                  className={`border-r border-[#f1f5f9] last:border-r-0 p-2 space-y-1.5 min-h-[200px] ${isToday ? "bg-[#09268E]/3" : ""}`}
                >
                  {groups.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-200 text-xs pt-8">—</div>
                  ) : (
                    groups.map((g) => renderGroupChip(g, false))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="border-t border-[#f1f5f9] px-4 py-3 flex flex-wrap gap-x-5 gap-y-1.5">
          {[
            { color: "#16a34a", label: "Mañana" },
            { color: "#ea580c", label: "Tarde" },
            { color: "#4f46e5", label: "Noche" },
            { color: "#dc2626", label: "Guardia" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-auto">{totalTurnos} turno{totalTurnos !== 1 ? "s" : ""} en el período</span>
        </div>
      </div>

      {(() => {
        const data = activeGrupo
          ? (byDateGrouped[activeGrupo.fechaKey]?.find((g) => g.key === activeGrupo.key) ?? null)
          : null;
        return data && activeGrupo ? (
          <GroupPopover
            grupo={data}
            anchorRect={activeGrupo.rect}
            onDeleteTurno={(t) => { setDeleteTarget(t); setActiveGrupo(null); }}
            onClose={() => setActiveGrupo(null)}
            allowDelete={allowDelete}
          />
        ) : null;
      })()}

    </div>
  );
}

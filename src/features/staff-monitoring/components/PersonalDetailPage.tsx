"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsuarioById } from "../services/personalDetailService";
import { getCargaTrabajoUsuario } from "../services/workloadService";
import { getAsignacionesTareas } from "../services/assignmentService";
import { getTareaById } from "../services/taskService";
import { CalendarioTurnos } from "./calendario/CalendarioTurnos";
import {
  PrioridadBadge,
  DisponibilidadBadge,
  fmtDate,
  fmtDateTime,
} from "./tareas/taskHelpers";
import type {
  PersonalMedicoDetalle,
  CargaTrabajo,
  AsignacionTarea,
  Tarea,
} from "../types";
import { NivelCarga, PrioridadTarea } from "../types";


const PRIORITY_ACCENT: Record<PrioridadTarea, { border: string; label: string }> = {
  [PrioridadTarea.Alta]:  { border: "#f43f5e", label: "Alta" },
  [PrioridadTarea.Media]: { border: "#f59e0b", label: "Media" },
  [PrioridadTarea.Baja]:  { border: "#10b981", label: "Baja" },
};


function getInitials(nombre: string, apellidos: string): string {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function getWorkloadVisual(nivel: NivelCarga) {
  return {
    [NivelCarga.Libre]: {
      accent: "#10b981",
      gradient: "linear-gradient(90deg, #10b981, #22c55e)",
      soft: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      progress: 12,
    },
    [NivelCarga.Baja]: {
      accent: "#2563eb",
      gradient: "linear-gradient(90deg, #2563eb, #38bdf8)",
      soft: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      progress: 32,
    },
    [NivelCarga.Media]: {
      accent: "#d97706",
      gradient: "linear-gradient(90deg, #d97706, #facc15)",
      soft: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      progress: 58,
    },
    [NivelCarga.Alta]: {
      accent: "#ea580c",
      gradient: "linear-gradient(90deg, #ea580c, #fb923c)",
      soft: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-100",
      progress: 78,
    },
    [NivelCarga.Critica]: {
      accent: "#dc2626",
      gradient: "linear-gradient(90deg, #dc2626, #fb7185)",
      soft: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      progress: 96,
    },
  }[nivel] ?? {
    accent: "#64748b",
    gradient: "linear-gradient(90deg, #64748b, #94a3b8)",
    soft: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-100",
    progress: 0,
  };
}

// Componente para mostrar cada tarea asignada en forma de tarjeta
function TaskCard({ tarea, asignacion }: { tarea: Tarea; asignacion: AsignacionTarea }) {
  const accent = PRIORITY_ACCENT[tarea.prioridad] ?? PRIORITY_ACCENT[PrioridadTarea.Baja];
  return (
    <div
      className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col overflow-hidden transition hover:shadow-md"
      style={{ borderLeft: `3px solid ${accent.border}` }}
    >
      <div className="px-4 pt-4 pb-3 flex-1 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest truncate"
            style={{ color: accent.border }}
          >
            {tarea.nombreTipoTarea}
          </span>
          
        </div>

        <p className="text-sm font-medium text-[#0f172a] line-clamp-2 leading-snug">
          {tarea.descripcion}
        </p>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="font-medium text-slate-700 truncate">{tarea.nombreArea}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>{fmtDateTime(asignacion.fechaAsignacion)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between gap-2">
        <PrioridadBadge prioridad={tarea.prioridad} />
        <span className="text-[10px] text-slate-400 truncate">Por {asignacion.nombreAsignadoPor}</span>
      </div>
    </div>
  );
}


function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-[#f1f5f9] last:border-b-0">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.5px] w-24 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-[#0f172a] font-medium flex-1 min-w-0">
        {value ?? <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-[#f1f5f9] rounded-lg" />
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 flex gap-5">
        <div className="w-20 h-20 rounded-2xl bg-[#f1f5f9] shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-6 bg-[#f1f5f9] rounded w-48" />
          <div className="h-4 bg-[#f1f5f9] rounded w-32" />
          <div className="h-4 bg-[#f1f5f9] rounded w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[#f1f5f9] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Pagina principal de detalle de personal médico. Muestra información del usuario, su carga de trabajo, 
// tareas asignadas y calendario de turnos.
export function PersonalDetailPage({ id }: { id: number }) {
  const router = useRouter();

  const [user, setUser] = useState<PersonalMedicoDetalle | null>(null);
  const [carga, setCarga] = useState<CargaTrabajo | null>(null);
  const [taskPairs, setTaskPairs] = useState<{ tarea: Tarea; asignacion: AsignacionTarea }[]>([]);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const userData = await getUsuarioById(id);
      setUser(userData);

      const [cargaResult, asignResult] = await Promise.allSettled([
        getCargaTrabajoUsuario(id),
        getAsignacionesTareas(1, 50, undefined, id),
      ]);

      if (cargaResult.status === "fulfilled") setCarga(cargaResult.value);

      if (asignResult.status === "fulfilled") {
        const asignaciones = asignResult.value.datos;
        const pairs = await Promise.all(
          asignaciones.map(async (asignacion) => {
            try {
              const tarea = await getTareaById(asignacion.tareaId);
              return { tarea, asignacion };
            } catch {
              return null;
            }
          }),
        );
        setTaskPairs(pairs.filter((p): p is { tarea: Tarea; asignacion: AsignacionTarea } => p !== null));
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setNotFound(true);
      } else {
        setError("No se pudo cargar la información del personal.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Skeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#0f172a] mb-1">Personal no encontrado</h2>
        <p className="text-sm text-slate-500 mb-6">No existe un miembro del equipo con ese ID.</p>
        <button
          type="button"
          onClick={() => router.push("/staff-monitoring")}
          className="btn btn-sm text-white border-none"
          style={{ background: "#09268E" }}
        >
          Volver al equipo médico
        </button>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-slate-500 mb-4">{error ?? "Error desconocido."}</p>
        <button type="button" onClick={() => void load()} className="btn btn-sm btn-ghost">
          Reintentar
        </button>
      </div>
    );
  }

  const initials = getInitials(user.nombre, user.apellidos);
  const fullName = `${user.nombre} ${user.apellidos}`;
  const activeTasks = taskPairs.filter(
    ({ tarea }) => tarea.estado !== 2 && tarea.estado !== 3,
  );
  const completedTasks = taskPairs.filter(({ tarea }) => tarea.estado === 3);
  const workloadLevel = carga?.nivelCarga ?? NivelCarga.Libre;
  const workloadDescription = carga?.nivelCargaDescripcion ?? "Libre";
  const workloadActiveTasks = carga?.totalTareasActivas ?? activeTasks.length;
  const workloadVisual = getWorkloadVisual(workloadLevel);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-7">

      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/staff-monitoring")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#09268E] transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver al equipo médico
      </button>

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* Color band */}
        <div className="h-2" style={{ background: "linear-gradient(90deg, #1A2B5E, #09268E)" }} />

        <div className="px-6 py-6 flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #1A2B5E, #09268E)" }}
          >
            {initials}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-[#0f172a] leading-tight">{fullName}</h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {user.roles.map((rol) => (
                    <span
                      key={rol}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-[#09268E]/20 bg-[#09268E]/5 text-[#09268E]"
                    >
                      {rol}
                    </span>
                  ))}
                  {user.nombreEspecialidad && (
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                      {user.nombreEspecialidad}
                    </span>
                  )}
                </div>
              </div>

              {user.estadoPersonal !== null && user.estadoPersonal !== undefined && (
                <DisponibilidadBadge estado={user.estadoPersonal} />
              )}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
              {user.nombreHospital && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                  {user.nombreHospital}
                </span>
              )}
              {user.nombreArea && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {user.nombreArea}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Info + Workload grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Contact info */}
        <div className="md:col-span-2 bg-white rounded-xl border border-[#e2e8f0] shadow-sm px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Información de contacto
          </p>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Cédula" value={user.cedula} />
          <InfoRow label="Hospital" value={user.nombreHospital} />
          <InfoRow label="Área" value={user.nombreArea} />
          
          <InfoRow
            label="Desde"
            value={user.fechaCreacion ? fmtDate(user.fechaCreacion) : undefined}
          />
          
        </div>

        {/* Workload */}
        <div className="relative overflow-hidden bg-white rounded-xl border border-[#dbe4f0] shadow-sm">
          <div className="h-1.5" style={{ background: workloadVisual.gradient }} />

          <div className="px-5 py-4 flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Carga de trabajo
              </p>
            </div>

            <div className="flex flex-1 items-center justify-center gap-4 py-5">
              <div
                className="relative size-32 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(${workloadVisual.accent} ${workloadVisual.progress * 3.6}deg, #edf2f7 0deg)`,
                }}
                aria-label={`${workloadActiveTasks} tareas activas. Nivel de carga: ${workloadDescription}`}
              >
                <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center px-2 text-center shadow-[inset_0_0_0_1px_#eef2f7]">
                  <span className="text-4xl font-extrabold leading-none text-[#0f172a]">
                    {workloadActiveTasks}
                  </span>
                  <span className="mt-1.5 text-[9px] font-bold uppercase leading-tight text-slate-400">
                    Tareas activas
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">
                  Nivel de carga
                </p>
                <p className={`mt-1 text-2xl font-extrabold leading-tight ${workloadVisual.text}`}>
                  {workloadDescription}
                </p>
            
              </div>
            </div>

            <div className="border-t border-[#eef2f7] pt-3">
              <p className="text-[10px] text-slate-400">
                {carga?.ultimaActualizacion
                  ? `Actualizado: ${fmtDate(carga.ultimaActualizacion)}`
                  : "Sin actualización registrada"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tasks section ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">Tareas asignadas</h2>
            <p className="text-xs text-slate-500">
              {activeTasks.length} activa{activeTasks.length !== 1 ? "s" : ""}
              {completedTasks.length > 0 && ` · ${completedTasks.length} completada${completedTasks.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {taskPairs.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">Sin tareas asignadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskPairs.map(({ tarea, asignacion }) => (
              <TaskCard key={asignacion.id} tarea={tarea} asignacion={asignacion} />
            ))}
          </div>
        )}
      </div>

      {/* ── Calendar section ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-[#0f172a] mb-4">Calendario de turnos</h2>
        <CalendarioTurnos
          usuarioId={id}
          showAreaFilter={false}
          allowDelete={false}
        />
      </div>

    </div>
  );
}

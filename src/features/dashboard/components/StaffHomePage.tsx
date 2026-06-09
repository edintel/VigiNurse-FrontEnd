"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { getUserById } from "@/features/staff-monitoring/services/personalDetailService";
import { getTaskAssignments } from "@/features/staff-monitoring/services/assignmentService";
import { getTaskById, updateTaskStatus } from "@/features/staff-monitoring/services/taskService";
import { updateStaffStatus } from "@/features/staff-monitoring/services/personalStatusService";
import { getShifts } from "@/features/staff-monitoring/services/shiftsService";
import { getEpisodesByDoctor } from "@/features/patients/services/episodeService";
import { toast } from "@/lib/toast";
import {
  EstadoTarea,
  PrioridadTarea,
  EstadoDisponibilidadPersonal,
} from "@/features/staff-monitoring/types";
import type { Tarea, AsignacionTarea, TurnoPersonal } from "@/features/staff-monitoring/types";
import { EpisodioEstado } from "@/features/patients/types";
import type { EpisodioHistorial } from "@/features/patients/types";
import { TaskDetailModal } from "@/features/staff-monitoring/components/tasks/TaskDetailModal";
import { ShiftCalendar } from "@/features/staff-monitoring/components/calendar/ShiftCalendar";
import {
  findCurrentAndNextShift,
  getGreeting,
  getTodayRange,
} from "@/features/dashboard/utils/staffHomeUtils";
import {
  AvailabilityDropdown,
  ConfirmCompleteModal,
  EmptyState,
  ESTADO_CONFIG,
  getStaffHomeTabs,
  iconCalendar,
  iconCheck,
  iconRefresh,
  iconUsers,
  LoadingSkeleton,
  PatientEpisodeCard,
  PriorityStatCard,
  TaskCard,
  FullShiftCard,
  ShiftInfoCard,
  type PriorityFilter,
  type TabId,
} from "@/features/dashboard/components/staff-home";


// Pagina principal del dashboard para personal médico y de enfermería. 
// Muestra un resumen de su jornada, tasks urgentes, pacientes asignados (para médicos) 
// y permite gestionar su disponibilidad y tasks.
export default function StaffHomePage() {
  const user = useAppSelector(selectCurrentUser);
  const router = useRouter();

  const isDoctor = user?.role?.toUpperCase() === "DOCTOR";
  const userId = user ? Number(user.id) : null;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("hoy");

  const [estado, setEstado] = useState<EstadoDisponibilidadPersonal | null>(null);
  const [savingEstado, setSavingEstado] = useState(false);

  const [taskPairs, setTaskPairs] = useState<{ tarea: Tarea; asignacion: AsignacionTarea }[]>([]);
  const [completingIds, setCompletingIds] = useState<Set<number>>(new Set());
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("todas");
  const [detailPair, setDetailPair] = useState<{ tarea: Tarea; asignacion: AsignacionTarea } | null>(null);
  const [confirmTarea, setConfirmTarea] = useState<Tarea | null>(null);
  const confirmModalRef = useRef<HTMLDialogElement>(null);

  const [turnoActual, setTurnoActual] = useState<TurnoPersonal | null>(null);
  const [proximoTurno, setProximoTurno] = useState<TurnoPersonal | null>(null);
  const [loadingTurnos, setLoadingTurnos] = useState(true);

  const [episodiosDoctor, setEpisodiosDoctor] = useState<EpisodioHistorial[]>([]);
  const [loadingEpisodios, setLoadingEpisodios] = useState(false);
  const [episodiosError, setEpisodiosError] = useState<string | null>(null);

  async function loadEpisodiosDoctor() {
    if (!userId) return;
    setLoadingEpisodios(true);
    setEpisodiosError(null);
    try {
      const result = await getEpisodesByDoctor(userId, 1, 20, {
        estado: EpisodioEstado.EnCurso,
      });
      setEpisodiosDoctor(result.datos);
    } catch {
      setEpisodiosError("No se pudieron cargar los pacientes asignados.");
    } finally {
      setLoadingEpisodios(false);
    }
  }

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadingTurnos(true);

    const { fechaDesde, fechaHasta } = getTodayRange();

    const [profileResult, asignResult, turnosResult] = await Promise.allSettled([
      getUserById(userId),
      getTaskAssignments(1, 100, undefined, userId),
      getShifts(1, 50, { usuarioId: userId, fechaDesde, fechaHasta }),
    ]);

    if (profileResult.status === "fulfilled") {
      setEstado(profileResult.value.estadoPersonal);
    }

    if (asignResult.status === "fulfilled") {
      const pairs = (
        await Promise.all(
          asignResult.value.datos.map(async (asignacion) => {
            try {
              const tarea = await getTaskById(asignacion.tareaId);
              return { tarea, asignacion };
            } catch {
              return null;
            }
          }),
        )
      ).filter((p): p is { tarea: Tarea; asignacion: AsignacionTarea } => p !== null);
      setTaskPairs(pairs);
    }

    setLoadingTurnos(false);
    if (turnosResult.status === "fulfilled") {
      const { current, next } = findCurrentAndNextShift(turnosResult.value.datos);
      setTurnoActual(current);
      setProximoTurno(next);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!loading && isDoctor) {
      void loadEpisodiosDoctor();
    }
    
  }, [loading, isDoctor]);

  async function handleStatusChange(nuevoEstado: EstadoDisponibilidadPersonal) {
    if (!userId || nuevoEstado === estado) return;
    setSavingEstado(true);
    const prev = estado;
    setEstado(nuevoEstado);
    try {
      await updateStaffStatus(nuevoEstado);
      toast.success(`Estado actualizado: ${ESTADO_CONFIG[nuevoEstado].label}`);
    } catch {
      setEstado(prev);
      toast.error("No se pudo actualizar el estado de disponibilidad.");
    } finally {
      setSavingEstado(false);
    }
  }

  function handleRequestComplete(tarea: Tarea) {
    setConfirmTarea(tarea);
    confirmModalRef.current?.showModal();
  }

  async function handleConfirmComplete() {
    if (!confirmTarea) return;
    const tareaId = confirmTarea.id;
    setCompletingIds((s) => new Set(s).add(tareaId));
    confirmModalRef.current?.close();
    try {
      await updateTaskStatus(tareaId, { estado: EstadoTarea.Completada });
      setTaskPairs((prev) => prev.filter((p) => p.tarea.id !== tareaId));
      toast.success("Tarea completada.");
    } catch {
      toast.error("No se pudo completar la tarea.");
    } finally {
      setCompletingIds((s) => {
        const n = new Set(s);
        n.delete(tareaId);
        return n;
      });
      setConfirmTarea(null);
    }
  }

  if (!user) return null;
  if (loading) {
    return (
      <div className="py-6 px-8 xl:px-12">
        <LoadingSkeleton />
      </div>
    );
  }

  const displayName = user.name?.trim() || "Usuario";
  const greeting = getGreeting();

  const activePairs = taskPairs.filter(
    ({ tarea }) =>
      tarea.estado !== EstadoTarea.Cancelada && tarea.estado !== EstadoTarea.Completada,
  );
  const altaCount = activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Alta).length;
  const mediaCount = activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Media).length;
  const bajaCount = activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Baja).length;
  const urgentPairs = activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Alta);

  const filteredPairs =
    filterPriority === "alta"
      ? activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Alta)
      : filterPriority === "media"
        ? activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Media)
        : filterPriority === "baja"
          ? activePairs.filter((p) => p.tarea.prioridad === PrioridadTarea.Baja)
          : activePairs;

  const tabs = getStaffHomeTabs(isDoctor);

  return (
    <div className="py-6 px-8 xl:px-12 space-y-5">
      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <TaskDetailModal
        open={detailPair !== null}
        tarea={detailPair?.tarea ?? null}
        asignacion={detailPair?.asignacion ?? null}
        onClose={() => setDetailPair(null)}
      />
      <ConfirmCompleteModal
        modalRef={confirmModalRef}
        confirming={confirmTarea ? completingIds.has(confirmTarea.id) : false}
        onConfirm={() => void handleConfirmComplete()}
      />

      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div
          className="h-1.5 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #1A2B5E, #09268E)" }}
        />

        {/* Greeting + availability */}
        <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              {greeting}
            </p>
            <h1 className="text-xl font-extrabold text-[#0f172a] truncate">{displayName}</h1>
            <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-[#09268E]/20 bg-[#09268E]/5 text-[#09268E]">
              {user.role}
            </span>
          </div>
          <div className="shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
              Mi disponibilidad
            </p>
            <AvailabilityDropdown
              estado={estado}
              saving={savingEstado}
              onSelect={(e) => void handleStatusChange(e)}
            />
          </div>
        </div>

        {/* Jornada summary row */}
        <div
          className={`px-6 pb-5 grid gap-3 ${
            isDoctor ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          <ShiftInfoCard
            current={turnoActual}
            next={proximoTurno}
            loadingTurnos={loadingTurnos}
          />

          <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fff1f2] flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 text-[#f43f5e]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Tareas urgentes
              </p>
              <p className="text-xl font-extrabold text-[#0f172a]">{altaCount}</p>
            </div>
          </div>

          {isDoctor && (
            <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4 text-[#09268E]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Pacientes activos
                </p>
                {loadingEpisodios ? (
                  <div className="h-7 w-8 bg-[#f1f5f9] rounded animate-pulse mt-0.5" />
                ) : (
                  <p className="text-xl font-extrabold text-[#0f172a]">{episodiosDoctor.length}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[#09268E] text-white shadow-sm"
                : "text-slate-500 hover:bg-white hover:text-slate-700",
            ].join(" ")}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Hoy ───────────────────────────────────────────────────── */}
      {activeTab === "hoy" && (
        <div className="space-y-6">
          {/* Turno */}
          <section>
            <h2 className="text-sm font-bold text-[#0f172a] mb-3">Tu turno</h2>
            {loadingTurnos ? (
              <div className="h-24 bg-[#f1f5f9] rounded-xl animate-pulse" />
            ) : turnoActual ?? proximoTurno ? (
              <FullShiftCard current={turnoActual} next={proximoTurno} />
            ) : (
              <EmptyState icon={iconCalendar} title="Sin turnos próximos" subtitle="No hay turnos asignados en los próximos días." />
            )}
          </section>

          {/* Tareas urgentes */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-[#0f172a]">Tareas urgentes</h2>
              {altaCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1f2] text-[#f43f5e]">
                  {altaCount}
                </span>
              )}
            </div>
            {urgentPairs.length === 0 ? (
              <EmptyState icon={iconCheck} title="Sin tareas urgentes" subtitle="No tienes tareas de alta prioridad en este momento." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {urgentPairs.map(({ tarea, asignacion }) => (
                  <TaskCard
                    key={asignacion.id}
                    tarea={tarea}
                    asignacion={asignacion}
                    completing={completingIds.has(tarea.id)}
                    onViewDetail={() => setDetailPair({ tarea, asignacion })}
                    onRequestComplete={() => handleRequestComplete(tarea)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Pacientes (Doctor only) */}
          {isDoctor && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#0f172a]">Pacientes asignados</h2>
                  {!loadingEpisodios && episodiosDoctor.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#09268E]">
                      {episodiosDoctor.length}
                    </span>
                  )}
                </div>
                {episodiosDoctor.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("pacientes")}
                    className="text-xs text-[#09268E] font-semibold hover:text-[#1A2B5E] transition cursor-pointer"
                  >
                    Ver todos →
                  </button>
                )}
              </div>
              {loadingEpisodios ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-36 bg-[#f1f5f9] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : episodiosError ? (
                <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {episodiosError}
                </div>
              ) : episodiosDoctor.length === 0 ? (
                <EmptyState icon={iconUsers} title="Sin pacientes asignados" subtitle="No tienes pacientes en curso en este momento." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {episodiosDoctor.slice(0, 3).map((ep) => (
                    <PatientEpisodeCard
                      key={ep.id}
                      ep={ep}
                      onView={() => router.push(`/patients/${ep.pacienteId}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── Tab: Mis Tareas ────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PriorityStatCard
              prioridad={PrioridadTarea.Alta}
              count={altaCount}
              active={filterPriority === "alta"}
              onClick={() => setFilterPriority((p) => (p === "alta" ? "todas" : "alta"))}
            />
            <PriorityStatCard
              prioridad={PrioridadTarea.Media}
              count={mediaCount}
              active={filterPriority === "media"}
              onClick={() => setFilterPriority((p) => (p === "media" ? "todas" : "media"))}
            />
            <PriorityStatCard
              prioridad={PrioridadTarea.Baja}
              count={bajaCount}
              active={filterPriority === "baja"}
              onClick={() => setFilterPriority((p) => (p === "baja" ? "todas" : "baja"))}
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#0f172a] mb-4">
              Tareas activas
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({activePairs.length} activa{activePairs.length !== 1 ? "s" : ""})
              </span>
            </h2>
            {filteredPairs.length === 0 ? (
              <EmptyState
                icon={iconCheck}
                title="Sin tareas activas"
                subtitle={
                  filterPriority === "todas"
                    ? "No tienes tareas asignadas en este momento."
                    : `No hay tareas de prioridad ${filterPriority}.`
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPairs.map(({ tarea, asignacion }) => (
                  <TaskCard
                    key={asignacion.id}
                    tarea={tarea}
                    asignacion={asignacion}
                    completing={completingIds.has(tarea.id)}
                    onViewDetail={() => setDetailPair({ tarea, asignacion })}
                    onRequestComplete={() => handleRequestComplete(tarea)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Mi Horario ────────────────────────────────────────────── */}
      {activeTab === "horario" && userId && (
        <ShiftCalendar
          usuarioId={userId}
          showAreaFilter={false}
          allowDelete={false}
          initialView="semanal"
        />
      )}

      {/* ── Tab: Mis Pacientes ─────────────────────────────────────────── */}
      {activeTab === "pacientes" && isDoctor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0f172a]">
              Pacientes en curso
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({episodiosDoctor.length})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => void loadEpisodiosDoctor()}
              disabled={loadingEpisodios}
              className="text-xs text-[#09268E] font-semibold hover:text-[#1A2B5E] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {iconRefresh}
              Actualizar
            </button>
          </div>

          {loadingEpisodios ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 bg-[#f1f5f9] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : episodiosError ? (
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {episodiosError}
            </div>
          ) : episodiosDoctor.length === 0 ? (
            <EmptyState
              icon={iconUsers}
              title="Sin pacientes asignados"
              subtitle="No tienes pacientes en curso en este momento."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodiosDoctor.map((ep) => (
                <PatientEpisodeCard
                  key={ep.id}
                  ep={ep}
                  onView={() => router.push(`/patients/${ep.pacienteId}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

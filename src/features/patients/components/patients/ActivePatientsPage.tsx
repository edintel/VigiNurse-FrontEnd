"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHasPermission } from "@/lib/hasPermission";
import { getActiveEpisodes } from "@/features/patients/services/episodeService";
import { getBabies } from "@/features/baby-monitoring/services/babyService";
import { getEpisodeVitalSigns } from "@/features/patients/services/vitalSignService";
import { getMedications } from "@/features/patients/services/medicationService";
import { getAdministrations } from "@/features/patients/services/medicationService";
import { getEpisodeOrders } from "@/features/patients/services/orderService";
import { ActivePatientsFilters, type FilterUIState } from "@/features/patients/components/patients/ActivePatientsFilters";
import { CreateEpisodeModal } from "@/features/patients/components/episodes/CreateEpisodeModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  TriageNivel,
  TRIAGE_CONFIG,
  MedicacionEstado,
  OrdenEstado,
} from "@/features/patients/types";
import { formatApellidosNombre } from "@/shared/utils/personName";
import type {
  EpisodioActivo,
  EpisodioFilters,
  PaginatedEpisodiosActivos,
  Medicacion,
  SignoVital,
} from "@/features/patients/types";

const PAGE_SIZE = 10;
const SESSION_KEY = "active-patients-filters";

interface SavedState {
  filters: EpisodioFilters;
  ui: FilterUIState;
  page: number;
}

function readSavedState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedState) : null;
  } catch {
    return null;
  }
}

function writeSavedState(state: SavedState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

function clearSavedState() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

// Formatea una fecha ISO a DD/MM/AAAA HH:MM.
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
}

// Badge de nivel de triage con color según el nivel.
function TriageBadge({ nivel }: { nivel: TriageNivel }) {
  const cfg = TRIAGE_CONFIG[nivel] ?? TRIAGE_CONFIG[TriageNivel.NoAplica];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.bgCls} ${cfg.borderCls} ${cfg.textCls}`}
    >
      {nivel !== TriageNivel.NoAplica && (
        <span className="font-black">{nivel}</span>
      )}
      {cfg.label}
    </span>
  );
}

// ── Tipos de estado para cada indicador ──────────────────────────────────────
type SignosStatus = "normal" | "fuera_rango" | "sin_signos";
type OrdenesStatus = "completas" | "pendientes" | "sin_ordenes";
type MedicacionStatus = "al_dia" | "atrasada" | "pendiente" | "sin_medicacion";

async function nextDoseFromLastAdmin(
  episodioId: number,
  m: Medicacion,
): Promise<Date | null> {
  try {
    const admins = await getAdministrations(episodioId, m.id);
    const baseStr =
      admins.length === 0
        ? m.fechaInicio
        : admins.reduce((a, b) =>
            new Date(a.fechaAdministracion) > new Date(b.fechaAdministracion)
              ? a
              : b,
          ).fechaAdministracion;

    const base = new Date(baseStr);
    if (Number.isNaN(base.getTime())) return null;
    return new Date(base.getTime() + m.frecuenciaHoras * 60 * 60 * 1000);
  } catch {
    return null;
  }
}

// ── Indicadores clínicos con lógica real ─────────────────────────────────────
function ClinicalIndicatorsCell({
  episodioId,
  refreshKey,
}: {
  episodioId: number;
  refreshKey: number;
}) {
  const [signos, setSignos] = useState<SignosStatus | null>(null);
  const [ordenes, setOrdenes] = useState<OrdenesStatus | null>(null);
  const [medicacion, setMedicacion] = useState<MedicacionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        // ── Fetch concurrente ────────────────────────────────────
        const [signosData, completadasResult, activaMeds] = await Promise.all([
          getEpisodeVitalSigns(episodioId),
          getEpisodeOrders(episodioId, { estado: OrdenEstado.Completada }, 1, 50),
          getMedications(episodioId, { estado: MedicacionEstado.Activa }),
        ]);

        // ── Calcular signos ──────────────────────────────────────
        const latestByType = new Map<number, SignoVital>();
        for (const s of signosData) {
          const prev = latestByType.get(s.tipoSignoId);
          if (!prev || new Date(s.fecha).getTime() > new Date(prev.fecha).getTime()) {
            latestByType.set(s.tipoSignoId, s);
          }
        }
        const signosValues = Array.from(latestByType.values());
        const newSignos: SignosStatus =
          signosValues.length === 0
            ? "sin_signos"
            : signosValues.some((s) => s.valor < s.minimoNormal || s.valor > s.maximoNormal)
            ? "fuera_rango"
            : "normal";

        // ── Calcular órdenes ─────────────────────────────────────
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const hayRecienteCompleta = completadasResult.datos.some(
          (o) => o.fechaEjecucion && new Date(o.fechaEjecucion).getTime() > oneHourAgo,
        );

        let newOrdenes: OrdenesStatus;
        if (hayRecienteCompleta) {
          newOrdenes = "completas";
        } else {
          const pendientesResult = await getEpisodeOrders(
            episodioId,
            { estado: OrdenEstado.Pendiente },
            1,
            1,
          );
          newOrdenes = pendientesResult.totalRegistros > 0 ? "pendientes" : "sin_ordenes";
        }

        // ── Calcular medicación ──────────────────────────────────
        const now = Date.now();
        const PENDING_MS = 10 * 60 * 1000;
        let newMed: MedicacionStatus = activaMeds.length === 0 ? "sin_medicacion" : "al_dia";

        if (newMed === "al_dia") {
          const proximas = await Promise.all(
            activaMeds.map((m) => nextDoseFromLastAdmin(episodioId, m)),
          );

          for (const proxima of proximas) {
            if (proxima && proxima.getTime() < now) {
              newMed = "atrasada";
              break;
            }
          }

          if (newMed === "al_dia") {
            for (const proxima of proximas) {
              if (proxima && proxima.getTime() - now < PENDING_MS) {
                newMed = "pendiente";
                break;
              }
            }
          }
        }

        // ── Aplicar estado solo si el componente sigue montado ───
        if (!cancelled) {
          setSignos(newSignos);
          setOrdenes(newOrdenes);
          setMedicacion(newMed);
        }
      } catch {
        if (!cancelled) {
          setSignos("normal");
          setOrdenes("sin_ordenes");
          setMedicacion("al_dia");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [episodioId, refreshKey]);

  if (loading) {
    return <span className="loading loading-spinner loading-xs text-slate-300" />;
  }

  const signosColor = signos === "fuera_rango" ? "#dc2626" : signos === "sin_signos" ? "#94a3b8" : "#16a34a";
  const ordenesColor = ordenes === "completas" ? "#16a34a" : ordenes === "pendientes" ? "#ea580c" : "#94a3b8";
  const medColor = medicacion === "atrasada" ? "#ef4444" : medicacion === "pendiente" ? "#ea580c" : medicacion === "sin_medicacion" ? "#94a3b8" : "#3b82f6";

  return (
    <div className="flex flex-col gap-1.5">
      {/* Signos vitales */}
      <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: signosColor }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke={signosColor} className="size-5 flex-shrink-0">
          <polyline strokeLinecap="round" strokeLinejoin="round" points="2,12 5,12 7,7 9,17 11,9 13,14 15,12 22,12" />
        </svg>
        {signos === "fuera_rango" ? "Fuera de rango" : signos === "sin_signos" ? "Sin signos" : "Normal"}
      </span>

      {/* Órdenes */}
      <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: ordenesColor }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke={ordenesColor} className="size-5 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4" />
        </svg>
        {ordenes === "completas" ? "Completas" : ordenes === "pendientes" ? "Pendientes" : "Sin órdenes"}
      </span>

      {/* Medicación */}
      <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color: medColor }}>
        <svg width="16" height="16" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <path d="M3.28125 10.5C2.36736 10.5 1.59201 10.1816 0.955208 9.54479C0.318403 8.90799 0 8.13264 0 7.21875C0 6.78125 0.0826389 6.36319 0.247917 5.96458C0.413194 5.56597 0.651389 5.21111 0.9625 4.9L4.9 0.9625C5.21111 0.651389 5.56597 0.413194 5.96458 0.247917C6.36319 0.0826389 6.78125 0 7.21875 0C8.13264 0 8.90799 0.318403 9.54479 0.955208C10.1816 1.59201 10.5 2.36736 10.5 3.28125C10.5 3.71875 10.4174 4.13681 10.2521 4.53542C10.0868 4.93403 9.84861 5.28889 9.5375 5.6L5.6 9.5375C5.28889 9.84861 4.93403 10.0868 4.53542 10.2521C4.13681 10.4174 3.71875 10.5 3.28125 10.5ZM7.16042 6.32917L8.72083 4.78333C8.91528 4.58889 9.06597 4.36042 9.17292 4.09792C9.27986 3.83542 9.33333 3.56319 9.33333 3.28125C9.33333 2.69792 9.12674 2.19965 8.71354 1.78646C8.30035 1.37326 7.80208 1.16667 7.21875 1.16667C6.93681 1.16667 6.66458 1.22014 6.40208 1.32708C6.13958 1.43403 5.91111 1.58472 5.71667 1.77917L4.17083 3.33958L7.16042 6.32917ZM3.28125 9.33333C3.56319 9.33333 3.83542 9.27986 4.09792 9.17292C4.36042 9.06597 4.58889 8.91528 4.78333 8.72083L6.32917 7.16042L3.33958 4.17083L1.77917 5.71667C1.58472 5.91111 1.43403 6.13958 1.32708 6.40208C1.22014 6.66458 1.16667 6.93681 1.16667 7.21875C1.16667 7.80208 1.37326 8.30035 1.78646 8.71354C2.19965 9.12674 2.69792 9.33333 3.28125 9.33333Z" fill={medColor}/>
        </svg>
        {medicacion === "atrasada" ? "Atrasada" : medicacion === "pendiente" ? "Próxima" : medicacion === "sin_medicacion" ? "Sin medicación" : "Al día"}
      </span>
    </div>
  );
}

// Estado vacío que se muestra cuando no se han aplicado filtros.
function EmptyFiltersState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 border-2 border-dashed border-[#e2e8f0] rounded-xl bg-white">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.2"
          stroke="#94a3b8"
          className="size-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
          />
        </svg>
      </div>
      <div className="text-center max-w-xs">
        <h3 className="text-lg font-bold text-[#1e293b] mb-1">
          Sin filtros seleccionados
        </h3>
        <p className="text-sm text-[#64748b]">
          Seleccione al menos un filtro para visualizar los pacientes en
          atención.
        </p>
      </div>
    </div>
  );
}

// Pestaña de pacientes en atención: requiere filtros para cargar datos.
export default function ActivePatientsPage() {
  const router = useRouter();
  const canCreateEpisode = useHasPermission("patients.episodesCreate");

  // IDs de pacientes que son bebés activos — se excluyen de este listado
  const babyIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    getBabies(1, 500)
      .then((res) => {
        babyIdsRef.current = new Set(
          res.datos.filter((b) => b.activo).map((b) => b.pacienteId)
        );
      })
      .catch(() => {});
  }, []);

  const [episodios, setEpisodios] = useState<EpisodioActivo[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indicatorsRefreshKey, setIndicatorsRefreshKey] = useState(0);

  // null = estado vacío (sin filtros aplicados aún)
  const [appliedFilters, setAppliedFilters] = useState<EpisodioFilters | null>(null);
  const [initialUI, setInitialUI] = useState<FilterUIState | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);

  const fetchEpisodes = useCallback(
    async (page: number, filters: EpisodioFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedEpisodiosActivos = await getActiveEpisodes(
          page,
          PAGE_SIZE,
          filters,
        );
        setEpisodios(result.datos.filter((e) => !babyIdsRef.current.has(e.pacienteId)));
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError(
          "No se pudieron cargar los pacientes en atención. Intente nuevamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Restaurar filtros guardados al montar
  useEffect(() => {
    const saved = readSavedState();
    if (saved) {
      setAppliedFilters(saved.filters);
      setInitialUI(saved.ui);
      void fetchEpisodes(saved.page, saved.filters);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleApplyFilters(filters: EpisodioFilters, ui: FilterUIState) {
    setAppliedFilters(filters);
    writeSavedState({ filters, ui, page: 1 });
    void fetchEpisodes(1, filters);
  }

  function handleClearFilters() {
    setAppliedFilters(null);
    clearSavedState();
    setEpisodios([]);
    setTotalRegistros(0);
    setTotalPaginas(1);
    setPaginaActual(1);
    setError(null);
  }

  function handlePageChange(page: number) {
    if (appliedFilters !== null) {
      writeSavedState({ filters: appliedFilters, ui: initialUI ?? { nombre: "", cedula: "", nivelTriage: "", areaId: null, areaSearch: "" }, page });
      void fetchEpisodes(page, appliedFilters);
    }
  }

  function handleEpisodeCreated() {
    if (appliedFilters !== null) {
      void fetchEpisodes(1, appliedFilters);
    }
  }

  const hasAppliedFilters = appliedFilters !== null;

  useEffect(() => {
    function refresh() {
      setIndicatorsRefreshKey((k) => k + 1);
    }
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Botón de acción */}
      {canCreateEpisode && (
        <div className="flex justify-end">
          <button
            type="button"
            className="btn text-white"
            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
            onClick={() => setShowCreate(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="size-[1.2em]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nuevo episodio
          </button>
        </div>
      )}

      {/* Panel de filtros */}
      <ActivePatientsFilters
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        initial={initialUI}
      />

      {/* Contenido principal */}
      {!hasAppliedFilters ? (
        <EmptyFiltersState />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {error && (
            <div role="alert" className="alert alert-error m-4 text-sm py-3">
              <span>{error}</span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() =>
                  void fetchEpisodes(paginaActual, appliedFilters!)
                }
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Leyenda de indicadores clínicos */}
          <div className="flex items-center gap-5 px-5 py-2.5 border-b border-[#f1f5f9] bg-[#fafafa]">
            <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#94a3b8]">Indicadores:</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#64748b" className="size-4.5 flex-shrink-0">
                <polyline strokeLinecap="round" strokeLinejoin="round" points="2,12 5,12 7,7 9,17 11,9 13,14 15,12 22,12" />
              </svg>
              Signos vitales
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#64748b" className="size-4.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4" />
              </svg>
              Órdenes médicas
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
              <svg width="17" height="17" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M3.28125 10.5C2.36736 10.5 1.59201 10.1816 0.955208 9.54479C0.318403 8.90799 0 8.13264 0 7.21875C0 6.78125 0.0826389 6.36319 0.247917 5.96458C0.413194 5.56597 0.651389 5.21111 0.9625 4.9L4.9 0.9625C5.21111 0.651389 5.56597 0.413194 5.96458 0.247917C6.36319 0.0826389 6.78125 0 7.21875 0C8.13264 0 8.90799 0.318403 9.54479 0.955208C10.1816 1.59201 10.5 2.36736 10.5 3.28125C10.5 3.71875 10.4174 4.13681 10.2521 4.53542C10.0868 4.93403 9.84861 5.28889 9.5375 5.6L5.6 9.5375C5.28889 9.84861 4.93403 10.0868 4.53542 10.2521C4.13681 10.4174 3.71875 10.5 3.28125 10.5ZM7.16042 6.32917L8.72083 4.78333C8.91528 4.58889 9.06597 4.36042 9.17292 4.09792C9.27986 3.83542 9.33333 3.56319 9.33333 3.28125C9.33333 2.69792 9.12674 2.19965 8.71354 1.78646C8.30035 1.37326 7.80208 1.16667 7.21875 1.16667C6.93681 1.16667 6.66458 1.22014 6.40208 1.32708C6.13958 1.43403 5.91111 1.58472 5.71667 1.77917L4.17083 3.33958L7.16042 6.32917ZM3.28125 9.33333C3.56319 9.33333 3.83542 9.27986 4.09792 9.17292C4.36042 9.06597 4.58889 8.91528 4.78333 8.72083L6.32917 7.16042L3.33958 4.17083L1.77917 5.71667C1.58472 5.91111 1.43403 6.13958 1.32708 6.40208C1.22014 6.66458 1.16667 6.93681 1.16667 7.21875C1.16667 7.80208 1.37326 8.30035 1.78646 8.71354C2.19965 9.12674 2.69792 9.33333 3.28125 9.33333Z" fill="#64748b"/>
              </svg>
              Medicación
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full [&_td]:py-3 [&_th]:py-2.5">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Área
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Paciente
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Fecha de admisión
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Razón de visita
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Nivel triage
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Médicos
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Indicadores clínicos
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <span className="loading loading-spinner loading-md text-[#09268E]" />
                    </td>
                  </tr>
                ) : !error && episodios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-base-content/40 text-sm"
                    >
                      No se encontraron pacientes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  episodios.map((ep) => (
                    <tr key={ep.episodioId} className="hover:bg-base-200">
                      {/* Área */}
                      <td>
                        <span className="text-sm text-[#475569] font-medium">
                          {ep.areaNombre}
                        </span>
                      </td>

                      {/* Paciente */}
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-[#0f172a]">
                            {formatApellidosNombre(ep.nombre, ep.apellidos)}
                          </span>
                          <span className="text-[11px] text-[#64748b] font-mono">
                            {ep.cedula || "---"}
                          </span>
                        </div>
                      </td>

                      {/* Fecha admisión */}
                      <td className="text-sm text-[#475569]">
                        {formatDate(ep.fechaAdmision)}
                      </td>

                      {/* Razón de visita */}
                      <td className="text-sm text-[#475569] max-w-[180px] truncate">
                        {ep.razonVisita || "—"}
                      </td>

                      {/* Nivel triage */}
                      <td>
                        <TriageBadge nivel={ep.nivelTriage} />
                      </td>

                      {/* Médicos */}
                      <td>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">Principal</span>
                            <span className={`text-xs ${ep.medicoPrincipalNombre ? "text-[#0f172a] font-medium" : "text-[#94a3b8] italic"}`}>
                              {ep.medicoPrincipalNombre ?? "Sin asignar"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-[#94a3b8] uppercase">En atención</span>
                            <span className={`text-xs ${ep.medicoActualNombre ? "text-[#0f172a] font-medium" : "text-[#94a3b8] italic"}`}>
                              {ep.medicoActualNombre ?? "Sin asignar"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Indicadores clínicos */}
                      <td>
                        <ClinicalIndicatorsCell
                          episodioId={ep.episodioId}
                          refreshKey={indicatorsRefreshKey}
                        />
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                            title="Ver ficha del paciente"
                            onClick={() =>
                              router.push(`/patients/${ep.pacienteId}`)
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                              className="size-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {hasAppliedFilters && (
            <PaginationFooter
              current={paginaActual}
              total={totalPaginas}
              totalRecords={totalRegistros}
              showing={episodios.length}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {canCreateEpisode && (
        <CreateEpisodeModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={handleEpisodeCreated}
        />
      )}

    </div>
  );
}

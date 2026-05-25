"use client";
import { useCallback, useEffect, useState } from "react";
import { getEpisodeVitalSigns } from "@/features/patients/services/vitalSignService";
import { getTiposSignoVital } from "@/features/administration/signosVitales/services/signosVitalesService";
import { VitalSignFormModal } from "@/features/patients/components/vitalSigns/VitalSignFormModal";
import { useSignosVitales } from "@/features/vitals-monitoring/hooks/useSignosVitales";
import { getMonitoresPorPaciente } from "@/features/vitals-monitoring/services/monitorService";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import type { SignoVital } from "@/features/patients/types";
import type { TipoSignoVital } from "@/features/administration/signosVitales/types";
import type { MonitorPacienteDto } from "@/features/vitals-monitoring/types";
import { toast } from "@/lib/toast";


function normalizeName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
}

function isBPTipo(nombre: string) {
  const n = normalizeName(nombre);
  return n.includes("sistol") || n.includes("diastol");
}

function isOutOfRange(valor: number, min: number, max: number) {
  return valor < min || valor > max;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

const LIVE_RANGES: Record<string, [number, number]> = {
  frecuenciaCardiaca: [60, 100],
  spO2: [95, 100],
  temperatura: [36.0, 37.5],
  presionSistolica: [90, 140],
  presionDiastolica: [60, 90],
  frecuenciaRespiratoria: [12, 20],
};

function isLiveOutOfRange(key: string, value: number | null): boolean {
  if (value === null) return false;
  const [min, max] = LIVE_RANGES[key] ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  return value < min || value > max;
}

const LIVE_CONN_BADGE = {
  connected: {
    text: "En vivo",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  connecting: {
    text: "Conectando…",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  disconnected: {
    text: "Desconectado",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  error: {
    text: "Error",
    cls: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
} as const;

function LiveVitalCard({
  label,
  value,
  unit,
  rangeKey,
}: {
  label: string;
  value: number | null;
  unit: string;
  rangeKey: keyof typeof LIVE_RANGES;
}) {
  const outOfRange = isLiveOutOfRange(rangeKey, value);
  return (
    <div
      className={`rounded-xl border p-4 ${
        outOfRange ? "border-red-200 bg-red-50/70" : "border-[#E2E8F0] bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-1.5">
        <span className={`text-3xl font-bold leading-none ${outOfRange ? "text-red-600" : "text-[#0f172a]"}`}>
          {value ?? "—"}
        </span>
        <span className="text-xs font-medium text-[#64748b] mb-0.5">{unit}</span>
      </div>
    </div>
  );
}

function MonitorRealtimePanel({
  pacienteId,
  monitor,
  onRefreshMonitor,
}: {
  pacienteId: number;
  monitor: MonitorPacienteDto;
  onRefreshMonitor: () => void;
}) {
  const { lectura, estado } = useSignosVitales(pacienteId);
  const cfg = LIVE_CONN_BADGE[estado];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#0f172a]">Signos vitales en tiempo real</h2>
            <p className="text-sm text-[#475569]">
              {monitor.tipoActivo} · {monitor.marcaActivo} {monitor.modeloActivo}
            </p>
            <p className="text-xs text-[#64748b]">Serie: {monitor.numeroSerieActivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold ${cfg.cls}`}>
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              {cfg.text}
            </span>
            <button
              type="button"
              className="btn btn-xs btn-ghost text-[#09268E]"
              onClick={onRefreshMonitor}
            >
              Actualizar conexión
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <LiveVitalCard label="Frec. cardiaca" value={lectura?.frecuenciaCardiaca ?? null} unit="lpm" rangeKey="frecuenciaCardiaca" />
        <LiveVitalCard label="SpO₂" value={lectura?.spO2 ?? null} unit="%" rangeKey="spO2" />
        <LiveVitalCard label="Temperatura" value={lectura ? Number(lectura.temperatura.toFixed(1)) : null} unit="°C" rangeKey="temperatura" />
        <LiveVitalCard label="Presión sistólica" value={lectura?.presionSistolica ?? null} unit="mmHg" rangeKey="presionSistolica" />
        <LiveVitalCard label="Presión diastólica" value={lectura?.presionDiastolica ?? null} unit="mmHg" rangeKey="presionDiastolica" />
        <LiveVitalCard label="Frec. respiratoria" value={lectura?.frecuenciaRespiratoria ?? null} unit="rpm" rangeKey="frecuenciaRespiratoria" />
      </div>

      <div className="text-xs text-[#64748b]">
        {lectura ? (
          <>Última lectura: {formatDate(lectura.registradoEn)}</>
        ) : (
          <>Esperando lecturas del monitor…</>
        )}
      </div>
    </div>
  );
}



function StatusBadge({ outOfRange }: { outOfRange: boolean }) {
  return outOfRange ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#dc2626]">
      Fuera de rango
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dcfce7] text-[#16a34a]">
      Normal
    </span>
  );
}

// Pagina principal de signos vitales, muestra las lecturas más recientes por tipo en tarjetas y un historial completo en tabla, con filtros. 
// Permite registrar nuevos signos vitales mediante un modal form.

function VitalCard({
  label,
  value,
  unit,
  outOfRange,
  fecha,
  registradoPor,
}: {
  label: string;
  value: string;
  unit: string;
  outOfRange: boolean;
  fecha: string;
  registradoPor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
          {label}
        </span>
        <StatusBadge outOfRange={outOfRange} />
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-bold text-[#0f172a] leading-none">{value}</span>
        <span className="text-xs font-medium text-[#64748b] mb-0.5">{unit}</span>
      </div>

      <div className="border-t border-[#f8fafc] pt-2 space-y-0.5">
        <p className="text-[10px] text-[#94a3b8]">{formatDate(fecha)}</p>
        <p className="text-[10px] font-semibold text-[#64748b] truncate">{registradoPor}</p>
      </div>
    </div>
  );
}

// ── derive most-recent cards ──────────────────────────────────────────────────

interface BPPair {
  sistolica: SignoVital;
  diastolica: SignoVital;
}

function buildCards(signos: SignoVital[]): {
  bpPair: BPPair | null;
  regular: SignoVital[];
} {
  if (signos.length === 0) return { bpPair: null, regular: [] };

  const sorted = [...signos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  const bpSignos = sorted.filter((s) => isBPTipo(s.tipoSignoNombre));
  const regularSignos = sorted.filter((s) => !isBPTipo(s.tipoSignoNombre));

  const seen = new Set<number>();
  const recent: SignoVital[] = [];
  for (const s of regularSignos) {
    if (!seen.has(s.tipoSignoId)) {
      seen.add(s.tipoSignoId);
      recent.push(s);
    }
  }

  const sistolica = bpSignos.find((s) => normalizeName(s.tipoSignoNombre).includes("sistol"));
  const diastolica = bpSignos.find((s) => normalizeName(s.tipoSignoNombre).includes("diastol"));
  const bpPair = sistolica && diastolica ? { sistolica, diastolica } : null;

  return { bpPair, regular: recent };
}

// ── main component ────────────────────────────────────────────────────────────

interface VitalSignsTabProps {
  episodioId: number;
  pacienteId: number;
  canCreate?: boolean;
}

export function VitalSignsTab({ episodioId, pacienteId, canCreate = true }: VitalSignsTabProps) {
  const [allSignos, setAllSignos] = useState<SignoVital[]>([]);
  const [tableSignos, setTableSignos] = useState<SignoVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipos, setTipos] = useState<TipoSignoVital[]>([]);

  // Filter state
  const [filterTipoId, setFilterTipoId] = useState<string>("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [monitorLookupLoading, setMonitorLookupLoading] = useState(true);
  const [monitorActivo, setMonitorActivo] = useState<MonitorPacienteDto | null>(null);

  useEffect(() => {
    if (!canCreate) setFormOpen(false);
  }, [canCreate]);

  const loadMonitorActivo = useCallback(async () => {
    setMonitorLookupLoading(true);
    try {
      let pagina = 1;
      let totalPaginas = 1;
      let encontrado: MonitorPacienteDto | null = null;

      do {
        const response = await getMonitoresPorPaciente(pacienteId, pagina, 50);
        const activos = response.datos
          .filter((m) => m.fechaDesasignacion === null)
          .sort(
            (a, b) =>
              new Date(b.fechaAsignacion).getTime() -
              new Date(a.fechaAsignacion).getTime(),
          );

        if (activos.length > 0) {
          [encontrado] = activos;
          break;
        }

        totalPaginas = response.totalPaginas;
        pagina += 1;
      } while (pagina <= totalPaginas);

      setMonitorActivo(encontrado);
    } catch {
      setMonitorActivo(null);
    } finally {
      setMonitorLookupLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void loadMonitorActivo();
  }, [loadMonitorActivo]);

  const loadAll = useCallback(async (showSuccess = false) => {
    setLoading(true);
    setError(null);
    try {
      const [data, tiposData] = await Promise.all([
        getEpisodeVitalSigns(episodioId),
        getTiposSignoVital(),
      ]);
      setAllSignos(data);
      setTableSignos(data);
      setTipos(tiposData);
      if (showSuccess) {
        toast.success("Signos vitales actualizados correctamente.");
      }
    } catch {
      setError("No se pudieron cargar los signos vitales. Intente nuevamente.");
      toast.error("No se pudieron cargar los signos vitales.");
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    if (monitorLookupLoading || monitorActivo) return;
    void loadAll();
  }, [loadAll, monitorActivo, monitorLookupLoading]);

  async function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setTableLoading(true);
    try {
      const filters: { tipoSignoId?: number; desde?: string; hasta?: string } = {};
      if (filterTipoId) filters.tipoSignoId = parseInt(filterTipoId);
      if (filterDesde) filters.desde = new Date(filterDesde).toISOString();
      if (filterHasta) filters.hasta = new Date(filterHasta + "T23:59:59").toISOString();
      const data = await getEpisodeVitalSigns(episodioId, filters);
      setTableSignos(data);
    } catch {
      toast.error("No se pudieron aplicar los filtros de signos vitales.");
    } finally {
      setTableLoading(false);
    }
  }

  function handleClearFilters() {
    setFilterTipoId("");
    setFilterDesde("");
    setFilterHasta("");
    setTableSignos(allSignos);
  }

  function handleCreated(signos: SignoVital[]) {
    const updated = [...signos, ...allSignos];
    setAllSignos(updated);
    setTableSignos(updated);
  }

  const { bpPair, regular } = buildCards(allSignos);
  const hasCards = bpPair !== null || regular.length > 0;

  if (monitorLookupLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }

  if (monitorActivo) {
    return (
      <MonitorRealtimePanel
        pacienteId={pacienteId}
        monitor={monitorActivo}
        onRefreshMonitor={() => void loadMonitorActivo()}
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        {canCreate && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-[#0f172a]">Signos Vitales</h2>
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setFormOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-[1.2em]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Registrar signo vital
            </button>
          </div>
        )}

        {/* Loading / error for initial load */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-[#09268E]" />
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="alert alert-error text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void loadAll(true)}>Reintentar</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Vital sign cards — most recent per type */}
            {hasCards && (
              <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
                Últimas lecturas por tipo
              </p>
            )}
            {hasCards && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {bpPair && (
                  <VitalCard
                    label="Presión arterial"
                    value={`${bpPair.sistolica.valor}/${bpPair.diastolica.valor}`}
                    unit={bpPair.sistolica.unidad}
                    outOfRange={
                      isOutOfRange(bpPair.sistolica.valor, bpPair.sistolica.minimoNormal, bpPair.sistolica.maximoNormal) ||
                      isOutOfRange(bpPair.diastolica.valor, bpPair.diastolica.minimoNormal, bpPair.diastolica.maximoNormal)
                    }
                    fecha={bpPair.sistolica.fecha}
                    registradoPor={bpPair.sistolica.regeneradoPorNombre}
                  />
                )}
                {regular.map((s) => (
                  <VitalCard
                    key={s.id}
                    label={s.tipoSignoNombre}
                    value={String(s.valor)}
                    unit={s.unidad}
                    outOfRange={isOutOfRange(s.valor, s.minimoNormal, s.maximoNormal)}
                    fecha={s.fecha}
                    registradoPor={s.regeneradoPorNombre}
                  />
                ))}
              </div>
            )}

            {/* Historial section label */}
            <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              Historial de registros
            </p>

            {/* Filters */}
            <FilterPanel
              onApply={(e) => void handleApplyFilters(e)}
              onClear={handleClearFilters}
            >
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1 w-52">
                  <FilterLabel>Tipo de signo vital</FilterLabel>
                  <select
                    className={filterInputCls + " cursor-pointer pr-8"}
                    value={filterTipoId}
                    onChange={(e) => setFilterTipoId(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="w-44">
                  <CallyDatePicker
                    id="filter-signos-desde"
                    label="Desde"
                    value={filterDesde}
                    onChange={setFilterDesde}
                    variant="filter"
                    placeholder="DD/MM/AAAA"
                  />
                </div>
                <div className="w-44">
                  <CallyDatePicker
                    id="filter-signos-hasta"
                    label="Hasta"
                    value={filterHasta}
                    onChange={setFilterHasta}
                    variant="filter"
                    placeholder="DD/MM/AAAA"
                  />
                </div>
              </div>
            </FilterPanel>

            {/* History table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]/50 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="#64748b" className="size-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#64748b]">
                  Historial completo de signos vitales
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                      <th className="text-xs font-semibold uppercase tracking-wide">
                        Tipo de signo vital
                      </th>
                      <th className="text-xs font-semibold uppercase tracking-wide">
                        Valor
                      </th>
                      <th className="text-xs font-semibold uppercase tracking-wide">
                        Fecha y hora
                      </th>
                      <th className="text-xs font-semibold uppercase tracking-wide">
                        Registrado por
                      </th>
                      <th className="text-xs font-semibold uppercase tracking-wide text-center">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <span className="loading loading-spinner loading-md text-[#09268E]" />
                        </td>
                      </tr>
                    ) : tableSignos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-base-content/40 text-sm">
                          No hay registros de signos vitales.
                        </td>
                      </tr>
                    ) : (
                      tableSignos.map((s) => {
                        const outOfRange = isOutOfRange(s.valor, s.minimoNormal, s.maximoNormal);
                        return (
                          <tr key={s.id} className="hover:bg-base-200">
                            <td>
                              <span className="font-semibold text-[#1A2B5E] text-sm">
                                {s.tipoSignoNombre}
                              </span>
                            </td>
                            <td>
                              <div>
                                <span className="text-sm font-bold text-[#0f172a]">
                                  {s.valor}
                                </span>
                                <span className="text-xs text-[#64748b] ml-1">
                                  {s.unidad}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#94a3b8] mt-0.5">
                                Normal: {s.minimoNormal}–{s.maximoNormal} {s.unidad}
                              </p>
                            </td>
                            <td className="text-sm text-[#475569] whitespace-nowrap">
                              {formatDate(s.fecha)}
                            </td>
                            <td className="text-sm text-[#475569]">
                              {s.regeneradoPorNombre}
                            </td>
                            <td className="text-center">
                              <StatusBadge outOfRange={outOfRange} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <VitalSignFormModal
        open={canCreate ? formOpen : false}
        episodioId={episodioId}
        onClose={() => setFormOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

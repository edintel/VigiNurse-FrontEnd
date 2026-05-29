"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMovementHistoryForBabyEpisode } from "@/features/baby-monitoring/services/babyService";
import {
  TipoEventoRastreo,
  TIPO_EVENTO_RASTREO_LABELS,
} from "@/features/baby-monitoring/types";
import type { Bebe, AsignacionBrazalete, EventoRastreo } from "@/features/baby-monitoring/types";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";

const PAGE_SIZE = 20;

interface BabyMovementHistoryProps {
  bebe: Bebe;
  assignments: AsignacionBrazalete[];
  assignmentsLoading: boolean;
}

const TIPO_EVENT_BADGE_CFG: Record<TipoEventoRastreo, string> = {
  [TipoEventoRastreo.Deteccion]:           "bg-blue-50 text-blue-700 border-blue-200",
  [TipoEventoRastreo.EntradaZona]:         "bg-emerald-50 text-emerald-700 border-emerald-200",
  [TipoEventoRastreo.SalidaZona]:          "bg-amber-50 text-amber-700 border-amber-200",
  [TipoEventoRastreo.FueraDeCobertura]:    "bg-red-50 text-red-700 border-red-200",
  [TipoEventoRastreo.SenalDebil]:          "bg-amber-50 text-amber-700 border-amber-200",
  [TipoEventoRastreo.EtiquetaDesconocida]: "bg-slate-100 text-slate-500 border-slate-200",
  [TipoEventoRastreo.SensorDesconocido]:   "bg-slate-100 text-slate-500 border-slate-200",
};

function EventTypeBadge({ tipo }: { tipo: TipoEventoRastreo }) {
  const cfg = TIPO_EVENT_BADGE_CFG[tipo] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>
      {TIPO_EVENTO_RASTREO_LABELS[tipo] ?? String(tipo)}
    </span>
  );
}

function formatDT(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch { return d; }
}

// Componente principal para mostrar el historial de movimientos del bebé, con filtros y paginación.
export function BabyMovementHistory({ bebe, assignments, assignmentsLoading }: BabyMovementHistoryProps) {
  const [events, setEvents] = useState<EventoRastreo[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoEventoRastreo | "">("");
  const [filterZonaId, setFilterZonaId] = useState<number | "">("");

  const [appliedDesde, setAppliedDesde] = useState("");
  const [appliedHasta, setAppliedHasta] = useState("");
  const [appliedTipo, setAppliedTipo] = useState<TipoEventoRastreo | "">("");
  const [appliedZonaId, setAppliedZonaId] = useState<number | "">("");

  const zonaOptions = useMemo(() => {
    const map = new Map<number, string>();
    events.forEach(ev => { if (ev.zonaId != null && ev.zonaNombre) map.set(ev.zonaId, ev.zonaNombre); });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [events]);

  const tipoValues = (Object.values(TipoEventoRastreo).filter(v => typeof v === "number") as TipoEventoRastreo[]);

  const load = useCallback(async (page: number, desde: string, hasta: string, tipo: TipoEventoRastreo | "", zonaId: number | "") => {
    if (assignmentsLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMovementHistoryForBabyEpisode(bebe.episodioId, {
        pagina: page,
        tamanio: PAGE_SIZE,
        desde: desde || null,
        hasta: hasta || null,
        tipoEvento: tipo !== "" ? tipo : null,
        zonaId: zonaId !== "" ? zonaId : null,
      });
      setEvents(res.datos);
      setTotalPages(res.totalPaginas);
      setTotalRecords(res.totalRegistros);
      setCurrentPage(res.paginaActual);
    } catch {
      setError("No se pudo cargar el historial de movimientos.");
    } finally {
      setLoading(false);
    }
  }, [bebe.episodioId, assignmentsLoading]);

  useEffect(() => {
    if (!assignmentsLoading) {
      void load(1, appliedDesde, appliedHasta, appliedTipo, appliedZonaId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentsLoading]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedDesde(filterDesde);
    setAppliedHasta(filterHasta);
    setAppliedTipo(filterTipo);
    setAppliedZonaId(filterZonaId);
    void load(1, filterDesde, filterHasta, filterTipo, filterZonaId);
  }

  function handleClearFilters() {
    setFilterDesde(""); setFilterHasta(""); setFilterTipo(""); setFilterZonaId("");
    setAppliedDesde(""); setAppliedHasta(""); setAppliedTipo(""); setAppliedZonaId("");
    void load(1, "", "", "", "");
  }

  function handlePageChange(page: number) {
    void load(page, appliedDesde, appliedHasta, appliedTipo, appliedZonaId);
  }

  if (!assignmentsLoading && assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]">
          <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Historial de movimientos</span>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <p className="text-sm font-semibold text-[#475569]">Sin assignments de brazalete</p>
          <p className="text-xs text-slate-400">Este bebé no tiene assignments de brazalete registradas.</p>
        </div>
      </div>
    );
  }

  return (
    <> 
    {/* Filters */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-44">
            <CallyDatePicker id="hist-desde" label="Desde" value={filterDesde} onChange={setFilterDesde} variant="filter" />
          </div>
          <div className="w-44">
            <CallyDatePicker id="hist-hasta" label="Hasta" value={filterHasta} onChange={setFilterHasta} variant="filter" />
          </div>
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Tipo</FilterLabel>
            <select
              className={filterInputCls}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value === "" ? "" : Number(e.target.value) as TipoEventoRastreo)}
            >
              <option value="">Todos</option>
              {tipoValues.map(t => <option key={t} value={t}>{TIPO_EVENTO_RASTREO_LABELS[t]}</option>)}
            </select>
          </div>
          {zonaOptions.length > 0 && (
            <div className="flex flex-col gap-1 w-44">
              <FilterLabel>Zona</FilterLabel>
              <select
                className={filterInputCls}
                value={filterZonaId}
                onChange={(e) => setFilterZonaId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Todas</option>
                {zonaOptions.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
          )}
        </div>
      </FilterPanel>
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Historial de movimientos</span>
        {totalRecords > 0 && (
          <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">{totalRecords}</span>
        )}
      </div>

      

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3 mx-5 mt-3">
          <span>{error}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void load(currentPage, appliedDesde, appliedHasta, appliedTipo, appliedZonaId)}>Reintentar</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Fecha evento</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Zona</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Sensor</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Brazalete</th>
              <th className="text-xs font-semibold uppercase tracking-wide">RSSI</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Batería</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Procesado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-base-content/40 text-sm">
                  No hay movimientos registrados para este bebé en el rango seleccionado.
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr key={ev.id} className="hover:bg-base-200">
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDT(ev.fechaEvento)}</td>
                  <td><EventTypeBadge tipo={ev.tipoEvento} /></td>
                  <td className="text-sm text-[#475569] truncate max-w-[120px]">{ev.zonaNombre ?? "—"}</td>
                  <td className="text-sm text-[#475569] truncate max-w-[120px]">{ev.sensorNombre ?? "—"}</td>
                  <td className="text-sm text-[#475569] font-mono whitespace-nowrap">{ev.brazaleteMac ?? "—"}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{ev.rssiDbm != null ? `${ev.rssiDbm} dBm` : "—"}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{ev.nivelBateria != null ? `${ev.nivelBateria}%` : "—"}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDT(ev.fechaProcesado)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <PaginationFooter
          current={currentPage}
          total={totalPages}
          totalRecords={totalRecords}
          showing={events.length}
          onPageChange={handlePageChange}
        />
      )}
    </div>
    </>
  );
}

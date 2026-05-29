"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getAlerts, acknowledgeAlert } from "@/features/baby-monitoring/services/babyService";
import {
  TipoAlertaBLE,
  SeveridadAlerta,
  EstadoAlertaBLE,
  TIPO_ALERTA_BLE_LABELS,
  SEVERIDAD_ALERTA_LABELS,
  ESTADO_ALERTA_BLE_LABELS,
} from "@/features/baby-monitoring/types";
import type { AlertaBrazalete } from "@/features/baby-monitoring/types";
import { CloseAlertModal } from "../bracelet/CloseAlertModal";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";

const PAGE_SIZE = 20;

function SeveridadBadge({ s }: { s: SeveridadAlerta }) {
  const cfg = {
    [SeveridadAlerta.Critica]: "bg-red-50 text-red-700 border-red-200",
    [SeveridadAlerta.Alta]:    "bg-orange-50 text-orange-700 border-orange-200",
    [SeveridadAlerta.Media]:   "bg-amber-50 text-amber-700 border-amber-200",
    [SeveridadAlerta.Baja]:    "bg-slate-100 text-slate-500 border-slate-200",
  }[s] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>{SEVERIDAD_ALERTA_LABELS[s]}</span>;
}

function StatusBadge({ e }: { e: EstadoAlertaBLE }) {
  const cfg = {
    [EstadoAlertaBLE.Abierta]:    "bg-red-50 text-red-700 border-red-200",
    [EstadoAlertaBLE.Reconocida]: "bg-blue-50 text-blue-700 border-blue-200",
    [EstadoAlertaBLE.Cerrada]:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[e] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>{ESTADO_ALERTA_BLE_LABELS[e]}</span>;
}

function formatDT(d: string) {
  try {
    return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return d; }
}

// Componente principal que muestra la tabla de alertas BLE con filtros, paginación y acciones para reconocer/cerrar alertas.
export default function GlobalBleAlertsTab() {
  const [alerts, setAlerts] = useState<AlertaBrazalete[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterEstado, setFilterEstado] = useState<EstadoAlertaBLE | "">("");
  const [filterSeveridad, setFilterSeveridad] = useState<SeveridadAlerta | "">("");
  const [filterTipo, setFilterTipo] = useState<TipoAlertaBLE | "">("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  const [appliedEstado, setAppliedEstado] = useState<EstadoAlertaBLE | "">("");
  const [appliedSeveridad, setAppliedSeveridad] = useState<SeveridadAlerta | "">("");
  const [appliedTipo, setAppliedTipo] = useState<TipoAlertaBLE | "">("");
  const [appliedDesde, setAppliedDesde] = useState("");
  const [appliedHasta, setAppliedHasta] = useState("");

  const [acknowledging, setAcknowledging] = useState<number | null>(null);
  const [closeModalAlertId, setCloseModalAlertId] = useState<number | null>(null);

  const loadAlerts = useCallback(async (
    page: number,
    estado: EstadoAlertaBLE | "",
    severidad: SeveridadAlerta | "",
    tipo: TipoAlertaBLE | "",
    desde: string,
    hasta: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAlerts({
        page,
        pageSize: PAGE_SIZE,
        status: estado !== "" ? estado : undefined,
        severity: severidad !== "" ? severidad : undefined,
        type: tipo !== "" ? tipo : undefined,
        dateFrom: desde || null,
        dateTo: hasta || null,
      });
      setAlerts(res.datos);
      setTotalPages(res.totalPaginas);
      setTotalRecords(res.totalRegistros);
      setCurrentPage(res.paginaActual);
    } catch {
      setError("No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAlerts(1, "", "", "", "", ""); }, [loadAlerts]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedEstado(filterEstado);
    setAppliedSeveridad(filterSeveridad);
    setAppliedTipo(filterTipo);
    setAppliedDesde(filterDesde);
    setAppliedHasta(filterHasta);
    void loadAlerts(1, filterEstado, filterSeveridad, filterTipo, filterDesde, filterHasta);
  }

  function handleClearFilters() {
    setFilterEstado(""); setFilterSeveridad(""); setFilterTipo(""); setFilterDesde(""); setFilterHasta("");
    setAppliedEstado(""); setAppliedSeveridad(""); setAppliedTipo(""); setAppliedDesde(""); setAppliedHasta("");
    void loadAlerts(1, "", "", "", "", "");
  }

  function handlePageChange(page: number) {
    void loadAlerts(page, appliedEstado, appliedSeveridad, appliedTipo, appliedDesde, appliedHasta);
  }

  async function handleAcknowledge(id: number) {
    setAcknowledging(id);
    try {
      await acknowledgeAlert(id);
      toast.success("Alerta reconocida.");
      void loadAlerts(currentPage, appliedEstado, appliedSeveridad, appliedTipo, appliedDesde, appliedHasta);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo reconocer la alerta.");
    } finally {
      setAcknowledging(null);
    }
  }

  const estadoValues = (Object.values(EstadoAlertaBLE).filter(v => typeof v === "number") as EstadoAlertaBLE[]);
  const severidadValues = (Object.values(SeveridadAlerta).filter(v => typeof v === "number") as SeveridadAlerta[]);
  const tipoValues = (Object.values(TipoAlertaBLE).filter(v => typeof v === "number") as TipoAlertaBLE[]);

  return (
    <div className="space-y-4">
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Estado</FilterLabel>
            <select
              className={filterInputCls}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value === "" ? "" : Number(e.target.value) as EstadoAlertaBLE)}
            >
              <option value="">Todos</option>
              {estadoValues.map(v => <option key={v} value={v}>{ESTADO_ALERTA_BLE_LABELS[v]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Severidad</FilterLabel>
            <select
              className={filterInputCls}
              value={filterSeveridad}
              onChange={(e) => setFilterSeveridad(e.target.value === "" ? "" : Number(e.target.value) as SeveridadAlerta)}
            >
              <option value="">Todas</option>
              {severidadValues.map(v => <option key={v} value={v}>{SEVERIDAD_ALERTA_LABELS[v]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-52">
            <FilterLabel>Tipo</FilterLabel>
            <select
              className={filterInputCls}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value === "" ? "" : Number(e.target.value) as TipoAlertaBLE)}
            >
              <option value="">Todos</option>
              {tipoValues.map(v => <option key={v} value={v}>{TIPO_ALERTA_BLE_LABELS[v]}</option>)}
            </select>
          </div>
          <div className="w-44">
            <CallyDatePicker id="alerts-desde" label="Desde" value={filterDesde} onChange={setFilterDesde} variant="filter" />
          </div>
          <div className="w-44">
            <CallyDatePicker id="alerts-hasta" label="Hasta" value={filterHasta} onChange={setFilterHasta} variant="filter" />
          </div>
        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Alertas BLE</span>
          {!loading && totalRecords > 0 && (
            <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">{totalRecords}</span>
          )}
        </div>

        {error && (
          <div role="alert" className="alert alert-error text-sm py-3 mx-5 mt-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void loadAlerts(1, appliedEstado, appliedSeveridad, appliedTipo, appliedDesde, appliedHasta)}>Reintentar</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Fecha</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Paciente</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Severidad</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Zona</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Brazalete</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Reconocida por</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-10"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-base-content/40 text-sm">No hay alertas que coincidan con los filtros aplicados.</td></tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-base-200">
                    <td className="text-sm text-[#475569] whitespace-nowrap">{formatDT(a.fechaCreacion)}</td>
                    <td className="text-sm text-[#475569] whitespace-nowrap">{a.pacienteNombre ?? "—"}</td>
                    <td className="text-sm text-[#475569] whitespace-nowrap">{TIPO_ALERTA_BLE_LABELS[a.tipo]}</td>
                    <td><SeveridadBadge s={a.severidad} /></td>
                    <td><StatusBadge e={a.estado} /></td>
                    <td className="text-sm text-[#475569] truncate max-w-[110px]">{a.zonaNombre ?? "—"}</td>
                    <td className="text-sm text-[#475569] font-mono whitespace-nowrap">{a.brazaleteMac}</td>
                    <td className="text-sm text-[#475569] truncate max-w-[180px]">{a.descripcion}</td>
                    <td className="text-sm text-[#475569] whitespace-nowrap">{a.reconocidaPorNombre ?? "—"}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {a.estado === EstadoAlertaBLE.Abierta && (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                            disabled={acknowledging === a.id}
                            onClick={() => void handleAcknowledge(a.id)}
                          >
                            {acknowledging === a.id ? <span className="loading loading-spinner loading-xs" /> : "Reconocer"}
                          </button>
                        )}
                        {a.estado !== EstadoAlertaBLE.Cerrada && (
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost text-slate-500 hover:text-red-600"
                            onClick={() => setCloseModalAlertId(a.id)}
                          >
                            Cerrar
                          </button>
                        )}
                        {a.notasCierre && (
                          <span className="text-xs text-slate-400 ml-1" title={a.notasCierre}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-3.5 inline">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
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
            showing={alerts.length}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {closeModalAlertId != null && (
        <CloseAlertModal
          open={closeModalAlertId != null}
          alertId={closeModalAlertId}
          onClose={() => setCloseModalAlertId(null)}
          onClosed={() => {
            setCloseModalAlertId(null);
            void loadAlerts(currentPage, appliedEstado, appliedSeveridad, appliedTipo, appliedDesde, appliedHasta);
          }}
        />
      )}
    </div>
  );
}

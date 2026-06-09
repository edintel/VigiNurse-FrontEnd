"use client";
import { useCallback, useEffect, useState } from "react";
import { getGatewaysBle } from "@/features/administration/areasAndZones/services/gatewayBleService";
import { GatewayFormModal } from "@/features/administration/areasAndZones/components/GatewayFormModal";
import {
  EstadoGatewayBle,
  type GatewayBle,
  type PaginatedGatewaysBle,
} from "@/features/administration/areasAndZones/types";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";

const PAGE_SIZE = 20;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Componente principal para administrar gateways BLE
export default function GatewaysBleAdminTab() {
  const [gateways, setGateways] = useState<GatewayBle[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterEstado, setFilterEstado] = useState("");
  const [appliedEstado, setAppliedEstado] = useState<EstadoGatewayBle | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editGateway, setEditGateway] = useState<GatewayBle | null>(null);

  const fetchGateways = useCallback(async (page: number, estado: EstadoGatewayBle | null) => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedGatewaysBle = await getGatewaysBle(page, PAGE_SIZE, estado);
      setGateways(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los gateways BLE.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchGateways(1, null); }, [fetchGateways]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const estado = filterEstado !== "" ? parseInt(filterEstado, 10) as EstadoGatewayBle : null;
    setAppliedEstado(estado);
    void fetchGateways(1, estado);
  }

  function handleClearFilters() {
    setFilterEstado("");
    setAppliedEstado(null);
    void fetchGateways(1, null);
  }

  function handleSaved(gw: GatewayBle) {
    if (editGateway) {
      setGateways((prev) => prev.map((g) => (g.id === gw.id ? gw : g)));
    } else {
      setGateways((prev) => [gw, ...prev]);
      setTotalRegistros((n) => n + 1);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-[#0f172a]">Gateways BLE</h2>
        <button
          type="button"
          className="btn text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={() => { setEditGateway(null); setShowForm(true); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-[1.2em]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo gateway
        </button>
      </div>

      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-40">
            <FilterLabel>Estado</FilterLabel>
            <select className={filterInputCls + " cursor-pointer pr-8"} value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="0">En línea</option>
              <option value="1">Inactivo</option>
              <option value="2">Offline</option>
            </select>
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void fetchGateways(paginaActual, appliedEstado)}>Reintentar</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">Nombre</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Dirección MAC</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Última conexión</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Área</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Zona</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
              ) : gateways.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-base-content/40 text-sm">No se encontraron gateways BLE.</td></tr>
              ) : (
                gateways.map((gw) => (
                  <tr key={gw.id} className="hover:bg-base-200">
                    <td className="font-medium text-[#0f172a] text-sm">{gw.nombre}</td>
                    <td>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {gw.direccionMac}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{formatDate(gw.ultimaConexion)}</td>
                    <td>
                      {gw.areaNombre ? (
                        <span className="text-sm text-[#1A2B5E] font-medium">{gw.areaNombre}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin área</span>
                      )}
                    </td>
                    <td>
                      {gw.zonaNombre ? (
                        <span className="text-sm text-[#1A2B5E] font-medium">{gw.zonaNombre}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin zona</span>
                      )}
                    </td>
                    <td className="text-sm text-slate-500 max-w-[180px] truncate">
                      {gw.descripcion ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar gateway"
                          onClick={() => { setEditGateway(gw); setShowForm(true); }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
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
        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={gateways.length}
          onPageChange={(p) => void fetchGateways(p, appliedEstado)}
        />
      </div>

      <GatewayFormModal
        open={showForm}
        gateway={editGateway}
        onClose={() => { setShowForm(false); setEditGateway(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}

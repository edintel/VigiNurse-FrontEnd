"use client";
import { useCallback, useEffect, useState } from "react";
import { getGatewaysBle } from "@/features/assets-managment/tracking/services/gatewayBleService";
import { CreateGatewayBleModal } from "@/features/assets-managment/tracking/components/CreateGatewayBleModal";
import { EditGatewayBleModal } from "@/features/assets-managment/tracking/components/EditGatewayBleModal";
import {
  EstadoGatewayBle,
  type GatewayBle,
  type GatewayBleFilters,
  type PaginatedGatewaysBle,
} from "@/features/assets-managment/tracking/types";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";

const PAGE_SIZE = 10;

type EstadoGatewayConfig = {
  bg: string;
  border: string;
  text: string;
  dot: string;
  dotExtra?: string;
  label: string;
};

const ESTADO_GW_CONFIG: Record<EstadoGatewayBle, EstadoGatewayConfig> = {
  [EstadoGatewayBle.Activo]: {
    bg: "bg-[rgba(0,211,144,0.08)]",
    border: "border-[rgba(0,211,144,0.25)]",
    text: "text-[#00a36c]",
    dot: "bg-[#00d390]",
    dotExtra: "animate-pulse",
    label: "En línea",
  },
  [EstadoGatewayBle.Inactivo]: {
    bg: "bg-[rgba(252,188,19,0.08)]",
    border: "border-[rgba(252,188,19,0.25)]",
    text: "text-[#c48a00]",
    dot: "bg-[#fcbc13]",
    label: "Inactivo",
  },
  [EstadoGatewayBle.Offline]: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-500",
    dot: "bg-slate-400",
    label: "Offline",
  },
};

function GatewayStatusBadge({ estado }: { estado: EstadoGatewayBle }) {
  const c =
    ESTADO_GW_CONFIG[estado] ?? ESTADO_GW_CONFIG[EstadoGatewayBle.Offline];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${c.bg} ${c.border} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.dotExtra ?? ""}`} />
      {c.label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Filtros internos del tab de gateways BLE
function GatewayFilters({
  onApply,
  onClear,
}: {
  onApply: (f: GatewayBleFilters) => void;
  onClear: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("");

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    onApply({
      nombre: nombre || undefined,
      estado:
        estado !== ""
          ? (parseInt(estado, 10) as EstadoGatewayBle)
          : null,
    });
  }

  function handleClear() {
    setNombre("");
    setEstado("");
    onClear();
  }

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 w-52">
          <FilterLabel>Nombre</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Ej. Gateway UCI..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 w-36">
          <FilterLabel>Estado</FilterLabel>
          <select
            className={filterInputCls + " cursor-pointer pr-8"}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="0">En línea</option>
            <option value="1">Inactivo</option>
            <option value="2">Offline</option>
          </select>
        </div>
      </div>
    </FilterPanel>
  );
}

export default function GatewaysBleTab() {
  const [gateways, setGateways] = useState<GatewayBle[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<GatewayBleFilters>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editGateway, setEditGateway] = useState<GatewayBle | null>(null);

  const fetchGateways = useCallback(
    async (page: number, filters: GatewayBleFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedGatewaysBle = await getGatewaysBle(
          page,
          PAGE_SIZE,
          filters,
        );
        setGateways(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError(
          "No se pudieron cargar los gateways BLE. Intente nuevamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchGateways(1, {});
  }, [fetchGateways]);

  function handleApplyFilters(filters: GatewayBleFilters) {
    setAppliedFilters(filters);
    void fetchGateways(1, filters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
    void fetchGateways(1, {});
  }

  function handlePageChange(page: number) {
    void fetchGateways(page, appliedFilters);
  }

  function handleCreated(gateway: GatewayBle) {
    setGateways((prev) => [gateway, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleUpdated(updated: GatewayBle) {
    setGateways((prev) =>
      prev.map((g) => (g.id === updated.id ? updated : g)),
    );
  }

  return (
    <div className="space-y-4">

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
          Registrar nuevo gateway
        </button>
      </div>

      <GatewayFilters
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => fetchGateways(paginaActual, appliedFilters)}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Nombre
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Dirección MAC
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Última conexión
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Área asignada
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Descripción
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : gateways.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron gateways BLE.
                  </td>
                </tr>
              ) : (
                gateways.map((gw) => (
                  <tr key={gw.id} className="hover:bg-base-200">
                    <td className="font-medium text-[#0f172a] text-sm">
                      {gw.nombre}
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {gw.direccionMac}
                      </span>
                    </td>
                    <td>
                      <GatewayStatusBadge estado={gw.estado} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {formatDate(gw.ultimaConexion)}
                    </td>
                    <td>
                      {gw.areaNombre ? (
                        <span className="text-sm text-[#1A2B5E] font-medium">
                          {gw.areaNombre}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Sin área
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">
                      {gw.descripcion ?? (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar gateway"
                          onClick={() => setEditGateway(gw)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                            stroke="currentColor"
                            className="size-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
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

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={gateways.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateGatewayBleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <EditGatewayBleModal
        open={editGateway !== null}
        gateway={editGateway}
        onClose={() => setEditGateway(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

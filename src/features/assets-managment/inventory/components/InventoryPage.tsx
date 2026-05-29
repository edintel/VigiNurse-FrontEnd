"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssets } from "@/features/assets-managment/inventory/services/assetService";
import { CreateAssetModal } from "@/features/assets-managment/inventory/components/CreateAssetModal";
import { EditAssetModal } from "@/features/assets-managment/inventory/components/EditAssetModal";
import { RetireAssetModal } from "@/features/assets-managment/inventory/components/RetireAssetModal";
import { InventoryFilters } from "@/features/assets-managment/inventory/components/InventoryFilters";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { ActivoEstado } from "@/features/assets-managment/inventory/types";
import type {
  Activo,
  ActivoFilters,
  PaginatedActivos,
} from "@/features/assets-managment/inventory/types";

const PAGE_SIZE = 10;

// Badge de condición/estado del activo
function StatusBadge({ estado }: { estado: ActivoEstado }) {
  const configs: Record<
    ActivoEstado,
    { bg: string; border: string; text: string; label: string }
  > = {
    [ActivoEstado.Disponible]: {
      bg: "bg-[rgba(0,211,144,0.1)]",
      border: "border-[rgba(0,211,144,0.2)]",
      text: "text-[#00d390]",
      label: "Disponible",
    },
    [ActivoEstado.Mantenimiento]: {
      bg: "bg-[rgba(252,188,19,0.1)]",
      border: "border-[rgba(252,188,19,0.2)]",
      text: "text-[#fcbc13]",
      label: "Mantenimiento",
    },
    [ActivoEstado.Retirado]: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-500",
      label: "Retirado",
    },
  };
  const c = configs[estado] ?? configs[ActivoEstado.Disponible];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${c.bg} ${c.border} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

// Icono de estrella que indica si el activo es crítico.
function CriticoIcon({ esCritico }: { esCritico: boolean }) {
  if (esCritico) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5 text-red-500"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-5 text-slate-300"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

// Componente principal de la pestaña de inventario.
export default function InventoryPage() {
  const router = useRouter();
  const [activos, setActivos] = useState<Activo[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros aplicados (para paginación)
  const [appliedFilters, setAppliedFilters] = useState<ActivoFilters>({});

  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [editActivo, setEditActivo] = useState<Activo | null>(null);
  const [retireAsset, setRetirarActivo] = useState<Activo | null>(null);

  const fetchAssets = useCallback(
    async (page: number, filters: ActivoFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedActivos = await getAssets(
          page,
          PAGE_SIZE,
          filters,
        );
        setActivos(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError("No se pudieron cargar los activos. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchAssets(1, {});
  }, [fetchAssets]);

  function handleApplyFilters(filters: ActivoFilters) {
    setAppliedFilters(filters);
    void fetchAssets(1, filters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
    void fetchAssets(1, {});
  }

  function handlePageChange(page: number) {
    void fetchAssets(page, appliedFilters);
  }

  function handleAssetCreated(activo: Activo) {
    setActivos((prev) => [activo, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleAssetUpdated(updated: Activo) {
    setActivos((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function handleAssetRetired(id: number) {
    setActivos((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, estado: ActivoEstado.Retirado, estadoNombre: "Retirado" }
          : a,
      ),
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
          Registrar nuevo activo
        </button>
      </div>

      <InventoryFilters
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => fetchAssets(paginaActual, appliedFilters)}
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
                  Número de serie
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Marca
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Modelo
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Tipo
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Condición
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Área
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-center w-20">
                  Crítico
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
              ) : activos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron activos.
                  </td>
                </tr>
              ) : (
                activos.map((activo) => (
                  <tr key={activo.id} className="hover:bg-base-200">
                    <td>
                      <span className="font-mono text-sm font-semibold text-[#09268E]">
                        {activo.numeroSerie}
                      </span>
                    </td>
                    <td className="font-medium text-[#0f172a] text-sm">
                      {activo.marca}
                    </td>
                    <td className="text-sm text-[#0f172a]">{activo.modelo}</td>
                    <td className="text-sm text-slate-500">
                      {activo.tipoActivoNombre}
                    </td>
                    <td>
                      <StatusBadge estado={activo.estado} />
                    </td>
                    <td className="text-sm text-[#0f172a]">
                      {activo.areaNombre}
                    </td>
                    <td className="text-center">
                      <CriticoIcon esCritico={activo.esCritico} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver detalle */}
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Ver detalle"
                          onClick={() =>
                            router.push(`/assets-management/${activo.id}`)
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
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E] disabled:text-slate-300"
                          title={
                            activo.estado !== ActivoEstado.Retirado
                              ? "Editar activo"
                              : "No se puede editar un activo retirado"
                          }
                          onClick={() => setEditActivo(activo)}
                          disabled={activo.estado === ActivoEstado.Retirado}
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
          showing={activos.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateAssetModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleAssetCreated}
      />
      <EditAssetModal
        open={editActivo !== null}
        activo={editActivo}
        onClose={() => setEditActivo(null)}
        onUpdated={handleAssetUpdated}
      />
      <RetireAssetModal
        open={retireAsset !== null}
        activo={retireAsset}
        onClose={() => setRetirarActivo(null)}
        onRetirado={handleAssetRetired}
      />
    </div>
  );
}

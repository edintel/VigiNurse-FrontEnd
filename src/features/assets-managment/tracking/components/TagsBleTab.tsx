"use client";
import { useCallback, useEffect, useState } from "react";
import { getTagsBle } from "@/features/assets-managment/tracking/services/tagBleService";
import { CreateTagBleModal } from "@/features/assets-managment/tracking/components/CreateTagBleModal";
import { EditTagBleModal } from "@/features/assets-managment/tracking/components/EditTagBleModal";
import {
  EstadoTagBle,
  type TagBle,
  type TagBleFilters,
  type PaginatedTagsBle,
} from "@/features/assets-managment/tracking/types";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";

const PAGE_SIZE = 10;

type EstadoTagBleConfig = {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
};

const ESTADO_TAG_CONFIG: Record<EstadoTagBle, EstadoTagBleConfig> = {
  [EstadoTagBle.Activo]: {
    bg: "bg-[rgba(0,211,144,0.08)]",
    border: "border-[rgba(0,211,144,0.25)]",
    text: "text-[#00a36c]",
    dot: "bg-[#00d390]",
    label: "Activo",
  },
  [EstadoTagBle.Inactivo]: {
    bg: "bg-[rgba(252,188,19,0.08)]",
    border: "border-[rgba(252,188,19,0.25)]",
    text: "text-[#c48a00]",
    dot: "bg-[#fcbc13]",
    label: "Inactivo",
  },
  [EstadoTagBle.Perdido]: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    dot: "bg-red-500",
    label: "Perdido",
  },
};

function TagStatusBadge({ estado }: { estado: EstadoTagBle }) {
  const c = ESTADO_TAG_CONFIG[estado] ?? ESTADO_TAG_CONFIG[EstadoTagBle.Activo];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${c.bg} ${c.border} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function mVToPercent(mv: number): number {
  return Math.min(100, Math.max(0, Math.round((mv - 2000) / 1000 * 100)));
}

function BatteryIcon({ nivel }: { nivel: number | null }) {
  if (nivel === null)
    return <span className="text-slate-400 text-xs">—</span>;
  const pct = mVToPercent(nivel);
  const color =
    pct > 60
      ? "text-emerald-500"
      : pct > 20
        ? "text-yellow-500"
        : "text-red-500";
  return (
    <div className="flex flex-col leading-tight">
      <span className={`text-sm font-bold ${color}`}>{pct}%</span>
      <span className="text-[10px] text-slate-400">{nivel} mV</span>
    </div>
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

// Filtros internos del tab de sensores BLE
function TagFilters({
  onApply,
  onClear,
}: {
  onApply: (f: TagBleFilters) => void;
  onClear: () => void;
}) {
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState("");

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    onApply({
      codigo: codigo || undefined,
      estado:
        estado !== ""
          ? (parseInt(estado, 10) as EstadoTagBle)
          : null,
    });
  }

  function handleClear() {
    setCodigo("");
    setEstado("");
    onClear();
  }

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 w-44">
          <FilterLabel>Código</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Ej. TAG-001..."
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
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
            <option value="0">Activo</option>
            <option value="1">Inactivo</option>
            <option value="2">Perdido</option>
          </select>
        </div>
      </div>
    </FilterPanel>
  );
}

export default function TagsBleTab() {
  const [tags, setTags] = useState<TagBle[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TagBleFilters>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editTag, setEditTag] = useState<TagBle | null>(null);

  const fetchTags = useCallback(
    async (page: number, filters: TagBleFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedTagsBle = await getTagsBle(
          page,
          PAGE_SIZE,
          filters,
        );
        setTags(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError("No se pudieron cargar los sensores BLE. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchTags(1, {});
  }, [fetchTags]);

  function handleApplyFilters(filters: TagBleFilters) {
    setAppliedFilters(filters);
    void fetchTags(1, filters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
    void fetchTags(1, {});
  }

  function handlePageChange(page: number) {
    void fetchTags(page, appliedFilters);
  }

  function handleCreated(tag: TagBle) {
    setTags((prev) => [tag, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleUpdated(updated: TagBle) {
    setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
          Registrar nuevo tag
        </button>
      </div>

      <TagFilters
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => fetchTags(paginaActual, appliedFilters)}
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
                  Código
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Dirección MAC
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Batería
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Última señal
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Activo asignado
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
              ) : tags.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron sensores BLE.
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-base-200">
                    <td>
                      <span className="font-mono text-sm font-semibold text-[#09268E]">
                        {tag.codigo}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {tag.direccionMac}
                      </span>
                    </td>
                    <td>
                      <TagStatusBadge estado={tag.estado} />
                    </td>
                    <td>
                      <BatteryIcon nivel={tag.nivelBateria} />
                    </td>
                    <td className="text-xs text-slate-500">
                      {formatDate(tag.ultimaSenal)}
                    </td>
                    <td>
                      {tag.activoDescripcion ? (
                        <span className="text-sm text-[#1A2B5E] font-medium">
                          {tag.activoDescripcion}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar sensor"
                          onClick={() => setEditTag(tag)}
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
          showing={tags.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateTagBleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <EditTagBleModal
        open={editTag !== null}
        tag={editTag}
        onClose={() => setEditTag(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

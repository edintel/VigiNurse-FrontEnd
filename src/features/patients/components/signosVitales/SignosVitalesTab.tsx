"use client";
import { useCallback, useEffect, useState } from "react";
import { getSignosVitalesEpisodio } from "@/features/patients/services/signoVitalService";
import { getTiposSignoVital } from "@/features/administration/signosVitales/services/signosVitalesService";
import { SignoVitalFormModal } from "@/features/patients/components/signosVitales/SignoVitalFormModal";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import type { SignoVital } from "@/features/patients/types";
import type { TipoSignoVital } from "@/features/administration/signosVitales/types";


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

interface SignosVitalesTabProps {
  episodioId: number;
  canCreate?: boolean;
}

export function SignosVitalesTab({ episodioId, canCreate = true }: SignosVitalesTabProps) {
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

  useEffect(() => {
    if (!canCreate) setFormOpen(false);
  }, [canCreate]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, tiposData] = await Promise.all([
        getSignosVitalesEpisodio(episodioId),
        getTiposSignoVital(),
      ]);
      setAllSignos(data);
      setTableSignos(data);
      setTipos(tiposData);
    } catch {
      setError("No se pudieron cargar los signos vitales. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setTableLoading(true);
    try {
      const filters: { tipoSignoId?: number; desde?: string; hasta?: string } = {};
      if (filterTipoId) filters.tipoSignoId = parseInt(filterTipoId);
      if (filterDesde) filters.desde = new Date(filterDesde).toISOString();
      if (filterHasta) filters.hasta = new Date(filterHasta + "T23:59:59").toISOString();
      const data = await getSignosVitalesEpisodio(episodioId, filters);
      setTableSignos(data);
    } catch {
      // keep previous table data on error
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
            <button className="btn btn-xs btn-ghost" onClick={() => void loadAll()}>Reintentar</button>
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

      <SignoVitalFormModal
        open={canCreate ? formOpen : false}
        episodioId={episodioId}
        onClose={() => setFormOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

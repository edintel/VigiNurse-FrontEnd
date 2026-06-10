"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBabies } from "@/features/baby-monitoring/services/babyService";
import { CreateBabyModal } from "@/features/baby-monitoring/components/CreateBabyModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import type { Bebe, PaginatedBebes } from "@/features/baby-monitoring/types";
import { formatApellidosNombre, formatBabyName } from "@/shared/utils/personName";

const PAGE_SIZE = 10;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "---";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function SexoBadge({ sexo }: { sexo: string }) {
  return sexo === "Masculino" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-blue-50 border-blue-200 text-blue-500">
      M
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-pink-50 border-pink-200 text-pink-500">
      F
    </span>
  );
}

function ApgarBadge({ score }: { score: number }) {
  const cls =
    score >= 7
      ? "bg-green-50 border-green-200 text-green-700"
      : score >= 4
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-red-50 border-red-200 text-red-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
      {score}/10
    </span>
  );
}


// Componente para el listado de bebés registrados en el sistema, con paginación y acciones básicas
export default function BabiesListPage() {
  const router = useRouter();

  const [bebes, setBebes] = useState<Bebe[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBabies = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedBebes = await getBabies(page, PAGE_SIZE);
      setBebes(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los bebés. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBabies(1);
  }, [fetchBabies]);

  function handlePageChange(page: number) {
    void fetchBabies(page);
  }

  function handleBabyCreated(bebe: Bebe) {
    setBebes((prev) => [bebe, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      {/* Botón de acción */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-[#0f172a]">Neonatos</h2>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Registrar bebé
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void fetchBabies(paginaActual)}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">Bebé</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Madre</th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Fecha de nacimiento
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">Sexo</th>
                <th className="text-xs font-semibold uppercase tracking-wide">APGAR</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Peso</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Semanas gest.</th>
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
              ) : !error && bebes.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron bebés registrados.
                  </td>
                </tr>
              ) : (
                bebes.map((bebe) => (
                  <tr key={bebe.id} className="hover:bg-base-200">
                    <td>
                      <span className="font-semibold text-sm text-[#0f172a]">
                        {formatBabyName(bebe.nombre, bebe.apellidos, bebe.nombreMadre, bebe.apellidosMadre)}
                      </span>
                    </td>
                    <td className="text-sm text-[#475569]">
                      {bebe.nombreMadre || bebe.apellidosMadre ? (
                        formatApellidosNombre(bebe.nombreMadre, bebe.apellidosMadre)
                      ) : (
                        <span className="text-slate-400 italic text-xs">Sin registrar</span>
                      )}
                    </td>
                    <td className="text-sm text-[#475569]">
                      {formatDate(bebe.fechaNacimiento)}
                    </td>
                    <td>
                      <SexoBadge sexo={bebe.sexo} />
                    </td>
                    <td>
                      <ApgarBadge score={bebe.puntuacionApgar} />
                    </td>
                    <td className="text-sm text-[#475569]">
                      {bebe.peso.toLocaleString("es-ES")} g
                    </td>
                    <td className="text-sm text-[#475569]">{bebe.semanasGestacion} sem.</td>
                    <td>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Ver ficha del bebé"
                          onClick={() => router.push(`/patients/${bebe.pacienteId}?bebeId=${bebe.id}`)}
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

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={bebes.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateBabyModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleBabyCreated}
      />
    </div>
  );
}

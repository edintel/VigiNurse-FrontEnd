"use client";
import { useCallback, useEffect, useState } from "react";
import { getVitalSignTypes } from "@/features/administration/vitalSigns/services/vitalSignsService";
import { CreateVitalSignTypeModal } from "@/features/administration/vitalSigns/components/CreateVitalSignTypeModal";
import { EditVitalSignTypeModal } from "@/features/administration/vitalSigns/components/EditVitalSignTypeModal";
import type { TipoSignoVital } from "@/features/administration/vitalSigns/types";


// Componente principal para la gestión de tipos de signos vitales en la administración. 
// Permite listar, crear y editar los tipos de signos vitales registrados en el sistema.
export default function VitalSignsPage() {
  const [tipos, setTipos] = useState<TipoSignoVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editTipo, setEditTipo] = useState<TipoSignoVital | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVitalSignTypes();
      setTipos(data);
    } catch {
      setError("No se pudieron cargar los tipos de signos vitales. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleCreated(tipo: TipoSignoVital) {
    setTipos((prev) => [...prev, tipo]);
  }

  function handleUpdated(updated: TipoSignoVital) {
    setTipos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
          Nuevo tipo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide w-20">
                  ID
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Nombre
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide w-32">
                  Unidad
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide w-48">
                  Rango normal
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right w-28">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : !error && tipos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No hay tipos de signos vitales registrados.
                  </td>
                </tr>
              ) : (
                tipos.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-base-200">
                    <td className="text-base-content/60 font-mono text-sm">
                      {tipo.id}
                    </td>
                    <td>
                      <span className="font-semibold text-[#1A2B5E]">
                        {tipo.nombre}
                      </span>
                    </td>
                    <td className="text-sm text-[#475569]">{tipo.unidad}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm text-[#475569]">
                        <span className="font-semibold text-green-600">
                          {tipo.minimoNormal}
                        </span>
                        <span className="text-[#94a3b8]">—</span>
                        <span className="font-semibold text-green-600">
                          {tipo.maximoNormal}
                        </span>
                        <span className="text-xs text-[#94a3b8] ml-0.5">
                          {tipo.unidad}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar tipo de signo vital"
                          onClick={() => setEditTipo(tipo)}
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
      </div>

      <CreateVitalSignTypeModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <EditVitalSignTypeModal
        open={editTipo !== null}
        tipo={editTipo}
        onClose={() => setEditTipo(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

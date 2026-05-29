"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPatientMonitors } from "@/features/vitals-monitoring/services/monitorService";
import { toast } from "@/lib/toast";
import type { MonitorPacienteDto } from "@/features/vitals-monitoring/types";
import { MonitorCard } from "./MonitorCard";
import { MonitorLinkForm } from "./MonitorLinkForm";

// Componente de carga para mostrar mientras se obtienen los datos de los monitores activos
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-200" />
      <div className="px-4 py-3 flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-200 rounded w-40" />
          <div className="h-2.5 bg-slate-100 rounded w-56" />
        </div>
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="border-t border-[#F1F5F9]" />
      <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center py-4 gap-1.5">
            <div className="h-4 w-4 bg-slate-200 rounded" />
            <div className="h-2 w-12 bg-slate-100 rounded" />
            <div className="h-6 w-10 bg-slate-200 rounded" />
            <div className="h-2 w-8 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#F1F5F9] border-t border-[#F1F5F9]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center py-4 gap-1.5">
            <div className="h-4 w-4 bg-slate-200 rounded" />
            <div className="h-2 w-12 bg-slate-100 rounded" />
            <div className="h-6 w-10 bg-slate-200 rounded" />
            <div className="h-2 w-8 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
      <div className="border-t border-[#F1F5F9] px-4 py-2">
        <div className="h-2.5 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// Función para generar un array de números de página con lógica de elipsis para paginación
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "ellipsis", total];
  if (current >= total - 2) return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}


// Componente principal para mostrar la vista de monitores de pacientes, con manejo de estado, carga de datos, 
// paginación y modal para vinculación
export function MonitorsView() {
  const [monitores, setMonitores] = useState<MonitorPacienteDto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [tamanoPagina, setTamanoPagina] = useState(6);
  const modalRef = useRef<HTMLDialogElement>(null);

  const loadMonitors = useCallback(async (page = paginaActual) => {
    try {
      setCargando(true);
      setError(null);
      const response = await getPatientMonitors(page, tamanoPagina, { activo: true });
      const activos = response.datos.filter((m) => m.activo);
      setMonitores(activos);
      setPaginaActual(response.paginaActual);
      setTotalPaginas(Math.max(response.totalPaginas, 1));
      setTotalRegistros(response.totalRegistros);
      if (response.tamanoPagina && response.tamanoPagina !== tamanoPagina) {
        setTamanoPagina(response.tamanoPagina);
      }
    } catch {
      const msg = "Error al cargar los monitores activos.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  }, [paginaActual, tamanoPagina]);

  useEffect(() => {
    void loadMonitors();
  }, [loadMonitors]);

  function handleAbrirForm() {
    setMostrarForm(true);
    modalRef.current?.showModal();
  }

  function handleCerrarForm() {
    setMostrarForm(false);
    modalRef.current?.close();
  }

  function handleVinculado(monitor: MonitorPacienteDto) {
    toast.success(`Monitor vinculado a ${monitor.nombrePaciente}.`);
    handleCerrarForm();
    void loadMonitors(1);
  }

  function handleUnassigned(id: number) {
    if (monitores.length === 1 && paginaActual > 1) {
      setPaginaActual((prev) => prev - 1);
      return;
    }
    setMonitores((prev) => prev.filter((m) => m.id !== id));
    void loadMonitors();
  }

  function cambiarPagina(page: number) {
    if (page < 1 || page > totalPaginas || page === paginaActual) return;
    setPaginaActual(page);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Monitores de Pacientes
            </h1>
            {!cargando && (
              <p className="text-sm text-slate-400 mt-0.5">
                {totalRegistros === 0
                  ? "Sin vinculaciones activas"
                  : `${totalRegistros} vinculación${totalRegistros !== 1 ? "es" : ""} activa${totalRegistros !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={handleAbrirForm}
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
          Vincular monitor
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-16rem)] flex-col">
       
        {cargando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-center gap-3 text-red-700 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
            <button
              onClick={() => void loadMonitors()}
              className="ml-auto text-xs font-medium underline underline-offset-2 hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        ) : monitores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-600">Sin monitores activos</p>
              <p className="text-sm text-slate-400 mt-1">
                Vincule un paciente con un activo para comenzar a monitorear.
              </p>
            </div>
            
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {monitores.map((m) => (
              <MonitorCard key={m.id} monitor={m} onDesasignado={handleUnassigned} />
            ))}
          </div>
        )}

        {!cargando && !error && totalPaginas > 1 && (
          <div className="mt-auto pt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 font-medium">
              Página {paginaActual} de {totalPaginas} · Mostrando {monitores.length} de {totalRegistros}
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Página anterior"
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#CBD5E1] text-slate-500 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#94A3B8] hover:text-[#1A2B5E] transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {getPageNumbers(paginaActual, totalPaginas).map((page, idx) =>
                page === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="h-12 w-6 sm:h-14 sm:w-8 flex items-center justify-center text-slate-400 text-lg font-medium"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => cambiarPagina(page)}
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 transition-all flex items-center justify-center text-xl font-semibold ${
                      page === paginaActual
                        ? "bg-[#09268E] border-[#09268E] text-white shadow-sm"
                        : "bg-white border-[#CBD5E1] text-slate-700 hover:border-[#94A3B8] hover:text-[#1A2B5E]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                aria-label="Página siguiente"
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-[#CBD5E1] text-slate-500 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#94A3B8] hover:text-[#1A2B5E] transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <dialog ref={modalRef} className="modal" onClose={handleCerrarForm}>
        <div className="modal-box bg-[#EEEEEE] w-full max-w-lg overflow-visible">
          <button
            type="button"
            className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
            onClick={handleCerrarForm}
          >
            ✕
          </button>
          <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
            Vincular paciente con monitor
          </h3>
          {mostrarForm && (
            <MonitorLinkForm onVinculado={handleVinculado} onCancelar={handleCerrarForm} />
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCerrarForm}>close</button>
        </form>
      </dialog>
    </div>
  );
}

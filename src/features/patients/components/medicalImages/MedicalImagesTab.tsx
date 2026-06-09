"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPatientStudies,
  getPacsPatient,
  searchPacsPatient,
  getPacsMatches,
  createPacsPatient,
} from "@/features/patients/services/medicalImagesService";
import {
  type EstudioImagen,
  type PacientePACSOrthancCoincidenciaDto,
} from "@/features/patients/types";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { OHIFViewerModal } from "./OHIFViewerModal";
import { toast } from "@/lib/toast";

const TIPOS_ESTUDIO = [
  "Radiografía",
  "Tomografía",
  "Resonancia magnética",
  "Ecografía",
  "Electrocardiograma",
  "Ecocardiograma",
  "Endoscopía",
];

const PAGE_SIZE = 20;

function formatDate(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "—";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}


interface PACSSeleccionModalProps {
  pacienteId: number;
  coincidencias: PacientePACSOrthancCoincidenciaDto[];
  onSeleccionado: () => void;
  onCerrar: () => void;
}

// Modal para seleccionar manualmente el paciente correcto en caso de múltiples coincidencias en PACS
function PACSSeleccionModal({
  pacienteId,
  coincidencias,
  onSeleccionado,
  onCerrar,
}: PACSSeleccionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { dialogRef.current?.showModal(); }, []);

  async function handleSeleccionar(c: PacientePACSOrthancCoincidenciaDto) {
    setSavingId(c.orthancPatientId);
    setError(null);
    try {
      await createPacsPatient(pacienteId, 0, c.orthancPatientId);
      toast.success("Paciente vinculado correctamente en PACS.");
      dialogRef.current?.close();
      onSeleccionado();
    } catch {
      setError("No se pudo vincular el paciente seleccionado.");
      toast.error("No se pudo vincular el paciente seleccionado.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg w-full">
        <h3 className="text-base font-bold text-[#1A2B5E] mb-1">
          Seleccionar paciente en PACS
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Se encontraron múltiples coincidencias. Selecciona la correcta.
        </p>
        {error && (
          <p className="text-xs text-red-600 mb-3">{error}</p>
        )}
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
          <table className="table table-sm w-full [&_td]:py-2.5 [&_th]:py-2">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">Nombre</th>
                <th className="text-xs font-semibold uppercase tracking-wide">ID</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Nacimiento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {coincidencias.map((c) => (
                <tr key={c.orthancPatientId} className="hover:bg-slate-50">
                  <td className="text-sm text-[#1e293b]">{c.patientName ?? "—"}</td>
                  <td className="text-sm text-slate-500 font-mono">{c.patientId ?? "—"}</td>
                  <td className="text-sm text-slate-500 whitespace-nowrap">
                    {c.patientBirthDate ?? "—"}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      disabled={savingId === c.orthancPatientId}
                      onClick={() => void handleSeleccionar(c)}
                      className="btn btn-xs text-white"
                      style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                    >
                      {savingId === c.orthancPatientId ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : "Seleccionar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-action mt-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCerrar}>close</button>
      </form>
    </dialog>
  );
}



type PACSStatus = "checking" | "ready" | "no_pacs" | "multiple" | "error";

interface MedicalImagesTabProps {
  pacienteId: number;
}

// Componente principal de la pestaña de imágenes médicas, que maneja la verificación del vínculo PACS, 
// carga y filtrado de estudios, y visualización en OHIF Viewer.
export function MedicalImagesTab({ pacienteId }: MedicalImagesTabProps) {
  const [pacsStatus, setPacsStatus] = useState<PACSStatus>("checking");
  const [coincidencias, setCoincidencias] = useState<PacientePACSOrthancCoincidenciaDto[]>([]);
  const [showPACSModal, setShowPACSModal] = useState(false);

  const [estudios, setEstudios] = useState<EstudioImagen[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tipoFilter, setTipoFilter] = useState("");
  const [activeTipoFilter, setActiveTipoFilter] = useState("");

  const [selectedEstudio, setSelectedEstudio] =
    useState<EstudioImagen | null>(null);

  const checkPACS = useCallback(async (showFeedback = false) => {
    setPacsStatus("checking");
    try {
      await getPacsPatient(pacienteId);
      setPacsStatus("ready");
      if (showFeedback) {
        toast.success("Vínculo PACS verificado correctamente.");
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        setPacsStatus("error");
        toast.error("No se pudo verificar el vínculo PACS del paciente.");
        return;
      }

      // No vinculado → buscar automáticamente
      try {
        await searchPacsPatient(pacienteId);
        setPacsStatus("ready");
        if (showFeedback) {
          toast.success("Paciente vinculado automáticamente con PACS.");
        }
      } catch (buscarErr: unknown) {
        const msg: string =
          (buscarErr as { response?: { data?: { mensaje?: string } } })
            ?.response?.data?.mensaje ?? "";
        const msgLow = msg.toLowerCase();
        if (msgLow.includes("no se encontró") || msgLow.includes("no se encontro")) {
          setPacsStatus("no_pacs");
          if (showFeedback) {
            toast.info("No se encontró un vínculo PACS para este paciente.");
          }
        } else {
          // Probablemente múltiples coincidencias
          try {
            const lista = await getPacsMatches(pacienteId);
            setCoincidencias(lista);
            setPacsStatus("multiple");
            setShowPACSModal(true);
            if (showFeedback) {
              toast.info("Se encontraron varias coincidencias en PACS. Selecciona el paciente correcto.");
            }
          } catch {
            setPacsStatus("error");
            toast.error("No se pudieron obtener las coincidencias en PACS.");
          }
        }
      }
    }
  }, [pacienteId]);

  // Verificación y auto-vinculación PACS al montar
  useEffect(() => {
    void checkPACS();
  }, [checkPACS]);

  // Función para cargar los estudios de imagen del paciente, con paginación y filtrado por tipo de estudio
  const loadEstudios = useCallback(
    async (pagina: number, tipo: string, showSuccess = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getPatientStudies(
          pacienteId,
          pagina,
          PAGE_SIZE,
          tipo || undefined,
        );
        setEstudios(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
        if (showSuccess) {
          toast.success("Estudios de imagen actualizados correctamente.");
        }
      } catch {
        setError("No se pudieron cargar los estudios de imagen.");
        toast.error("No se pudieron cargar los estudios de imagen.");
      } finally {
        setLoading(false);
      }
    },
    [pacienteId],
  );

  useEffect(() => {
    if (pacsStatus === "ready") {
      void loadEstudios(1, activeTipoFilter);
    }
  }, [loadEstudios, activeTipoFilter, pacsStatus]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPaginaActual(1);
    setActiveTipoFilter(tipoFilter);
  }

  function clearFilters() {
    setTipoFilter("");
    setActiveTipoFilter("");
  }

  const hasActiveFilters = activeTipoFilter !== "";

  // ── Estados PACS que bloquean el contenido ──────────────────────────────────
  if (pacsStatus === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="loading loading-spinner loading-md text-[#09268E]" />
        <p className="text-sm text-slate-500">Verificando vínculo con PACS…</p>
      </div>
    );
  }

  if (pacsStatus === "no_pacs") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth="1.5" stroke="currentColor" className="size-10 text-[#B0B0B0]">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18" />
        </svg>
        <p className="text-sm font-medium text-[#64748b]">
          Este paciente no tiene estudios disponibles en PACS.
        </p>
      </div>
    );
  }

  if (pacsStatus === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center px-6">
        <p className="text-sm text-red-600">
          No se pudo verificar el vínculo PACS del paciente.
        </p>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => void checkPACS(true)}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Modal selección manual PACS */}
      {showPACSModal && pacsStatus === "multiple" && (
        <PACSSeleccionModal
          pacienteId={pacienteId}
          coincidencias={coincidencias}
          onSeleccionado={() => { setShowPACSModal(false); setPacsStatus("ready"); }}
          onCerrar={() => { setShowPACSModal(false); setPacsStatus("no_pacs"); }}
        />
      )}

      {/* OHIF Viewer modal (full screen overlay) */}
      {selectedEstudio && (
        <OHIFViewerModal
          estudio={selectedEstudio}
          onClose={() => setSelectedEstudio(null)}
        />
      )}

      <div className="space-y-4">
        {/* Filtros */}
        <FilterPanel onApply={applyFilters} onClear={clearFilters}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1 w-44">
              <FilterLabel>Tipo de estudio</FilterLabel>
              <select
                className={filterInputCls}
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {TIPOS_ESTUDIO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </FilterPanel>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {error && (
            <div role="alert" className="alert alert-error m-4 text-sm py-3">
              <span>{error}</span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => void loadEstudios(paginaActual, activeTipoFilter, true)}
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full [&_td]:py-3 [&_th]:py-2.5">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                  <th className="text-xs font-semibold uppercase tracking-wide">Fecha</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Hospital</th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <span className="loading loading-spinner loading-md text-[#09268E]" />
                    </td>
                  </tr>
                ) : !error && estudios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-base-content/40 text-sm">
                      No hay estudios de imagen registrados
                      {hasActiveFilters ? " que coincidan con los filtros aplicados." : "."}
                    </td>
                  </tr>
                ) : (
                  estudios.map((estudio) => (
                    <tr key={estudio.id} className="hover:bg-base-200">
                      <td className="text-sm text-[#0f172a] whitespace-nowrap">
                        {formatDate(estudio.fechaEstudio)}
                      </td>
                      <td className="text-sm font-medium text-[#1A2B5E]">
                        {estudio.tipoEstudio}
                      </td>
                      <td className="text-sm text-[#64748b] max-w-[200px] truncate">
                        {estudio.descripcion ?? <span className="text-[#B0B0B0]">—</span>}
                      </td>
                      <td className="text-sm text-[#64748b] whitespace-nowrap">
                        {estudio.nombreHospital}
                      </td>
                      <td className="text-right">
                        {estudio.orthancStudyId && estudio.fechaEstudio ? (
                          <button
                            type="button"
                            title="Abrir en visor OHIF"
                            className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                            onClick={() => setSelectedEstudio(estudio)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                              viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                              className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold uppercase tracking-[0.5px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                              strokeWidth="2" stroke="currentColor" className="size-3">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            Pendiente
                          </span>
                        )}
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
            showing={estudios.length}
            onPageChange={(p) => void loadEstudios(p, activeTipoFilter)}
          />
        </div>
      </div>
    </>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAdministrations } from "@/features/patients/services/medicationService";
import {
  MedicacionEstado,
  MEDICACION_ESTADO_CONFIG,
  type Medicacion,
  type Administracion,
} from "@/features/patients/types";
import { RegisterAdministrationModal } from "./RegisterAdministrationModal";
import { SuspendMedicationModal } from "./SuspendMedicationModal";
import { ResumeMedicationModal } from "./ResumeMedicationModal";
import { FinalizeMedicationModal } from "./FinalizeMedicationModal";
import { toast } from "@/lib/toast";

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}
function formatDatetime(s: string) {
  try {
    return new Date(s).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return s;
  }
}

// Calcula la fecha de la próxima dosis sumando la frecuencia a la última administración o a la fecha de inicio si no hay administraciones.
function nextDoseDate(admins: Administracion[], m: Medicacion): Date | null {
  if (admins.length === 0) {
    const d = new Date(m.fechaInicio);
    d.setHours(d.getHours() + m.frecuenciaHoras);
    return d;
  }
  const last = admins.reduce((a, b) =>
    new Date(a.fechaAdministracion) > new Date(b.fechaAdministracion) ? a : b,
  );
  const d = new Date(last.fechaAdministracion);
  d.setHours(d.getHours() + m.frecuenciaHoras);
  return d;
}

interface Props {
  open: boolean;
  medicacion: Medicacion | null;
  episodioId: number;
  onClose: () => void;
  onUpdated: (m: Medicacion) => void;
}

// Modal para mostrar los detalles de una medicación, su historial de administraciones y acciones relacionadas 
// (registrar administración, suspender, reanudar, finalizar).
export function MedicationDetailModal({
  open,
  medicacion,
  episodioId,
  onClose,
  onUpdated,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [admins, setAdmins] = useState<Administracion[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [reanudarOpen, setReanudarOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  const loadAdmins = useCallback(async () => {
    if (!medicacion) return;
    setLoadingAdmins(true);
    try {
      const data = await getAdministrations(episodioId, medicacion.id);
      setAdmins(
        data.sort(
          (a, b) =>
            new Date(b.fechaAdministracion).getTime() -
            new Date(a.fechaAdministracion).getTime(),
        ),
      );
    } catch {
      setAdmins([]);
      toast.error("No se pudo cargar el historial de administraciones.");
    } finally {
      setLoadingAdmins(false);
    }
  }, [episodioId, medicacion]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      void loadAdmins();
    } else dialogRef.current?.close();
  }, [open, loadAdmins]);

  const estadoCfg = medicacion
    ? MEDICACION_ESTADO_CONFIG[medicacion.estado]
    : null;
  const isActive = medicacion?.estado === MedicacionEstado.Activa;
  const isSuspended = medicacion?.estado === MedicacionEstado.Suspendida;
  const isEnded =
    medicacion?.estado === MedicacionEstado.Completada ||
    medicacion?.estado === MedicacionEstado.Cancelada;
  const nextDose =
    medicacion && !isEnded ? nextDoseDate(admins, medicacion) : null;
  const isOverdue = nextDose ? nextDose < new Date() : false;

  function handleAdminCreated(a: Administracion) {
    setAdmins((prev) => [a, ...prev]);
  }

  function handleUpdated(m: Medicacion) {
    onUpdated(m);
    onClose();
  }

  return (
    <>
      <dialog ref={dialogRef} className="modal" onClose={onClose}>
        <div className="modal-box max-w-3xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-[#F8FAFC]/80 border-b border-[#f1f5f9] px-7 pt-6 pb-5 flex-shrink-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-[#0f172a]">
                  {medicacion?.medicamentoNombre ?? "—"}
                </h3>
                {estadoCfg && (
                  <span
                    className={`inline-flex items-center text-[10px] font-bold uppercase tracking-[0.6px] px-3 py-1 rounded-full border ${estadoCfg.bgCls} ${estadoCfg.textCls} border-[rgba(9,33,104,0.1)]`}
                  >
                    {estadoCfg.label}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost btn-circle text-[#64748b] shrink-0"
                onClick={onClose}
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                  Inicio
                </p>
                <p className="text-sm font-semibold text-[#334155]">
                  {medicacion ? formatDatetime(medicacion.fechaInicio) : "—"}
                </p>
              </div>
              <div className="w-px h-6 bg-[#e2e8f0]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                  Fin
                </p>
                <p className="text-sm font-semibold text-[#334155]">
                  {medicacion?.fechaFin ? (
                    formatDate(medicacion.fechaFin)
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  )}
                </p>
              </div>
              {nextDose && (
                <>
                  <div className="w-px h-6 bg-[#e2e8f0]" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                      Próxima dosis
                    </p>
                    <p
                      className={`text-sm font-semibold ${isOverdue ? "text-[#ff627d]" : "text-[#334155]"}`}
                    >
                      {formatDatetime(nextDose.toISOString())}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Prescription details card */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#F8FAFC]/50 border-b border-[#f1f5f9] px-5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.7px] text-[#334155]">
                  Detalles de la prescripción
                </p>
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="#64748b"
                    className="size-4 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-[0.4px] font-bold">
                      Médico prescriptor
                    </p>
                    <p className="text-sm font-semibold text-[#334155]">
                      {medicacion?.doctorNombre ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="#64748b"
                    className="size-4 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-[0.4px] font-bold">
                      Frecuencia
                    </p>
                    <p className="text-sm font-semibold text-[#334155]">
                      Cada {medicacion?.frecuenciaHoras} hora
                      {medicacion?.frecuenciaHoras !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="#64748b"
                    className="size-4 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                    />
                  </svg>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-[0.4px] font-bold">
                      Dosis
                    </p>
                    <p className="text-sm font-semibold text-[#334155]">
                      {medicacion?.dosis} {medicacion?.unidadMedida}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrations card */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#F8FAFC]/50 border-b border-[#f1f5f9] px-5 py-3 flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.7px] text-[#334155]">
                  Historial de suministraciones
                </p>
                <span className="text-[10px] font-bold bg-[#e2e8f0] text-[#64748b] rounded-full px-2 py-0.5">
                  {admins.length}
                </span>
              </div>
              {loadingAdmins ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-md text-[#092168]" />
                </div>
              ) : admins.length === 0 ? (
                <p className="text-center text-sm text-[#94a3b8] py-8">
                  Sin suministraciones registradas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full [&_td]:py-3 [&_th]:py-2.5">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#f1f5f9]">
                        <th className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] pl-5">
                          Fecha y hora
                        </th>
                        <th className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                          Encargado/a
                        </th>
                        <th className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
                          Observaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a) => (
                        <tr key={a.id} className="hover:bg-base-200/40">
                          <td className="pl-5 text-sm font-semibold text-[#475569] whitespace-nowrap">
                            {formatDatetime(a.fechaAdministracion)}
                          </td>
                          <td className="text-sm text-[#475569]">
                            {a.enfermeraNombre}
                          </td>
                          <td className="text-sm text-[#475569]">
                            {a.observaciones || (
                              <span className="text-[#94a3b8]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          {!isEnded && (
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex items-center gap-2 flex-wrap justify-end">
              {isActive && (
                <button
                  type="button"
                  className="btn btn-sm text-white shadow-sm"
                  style={{ backgroundColor: "#092168", borderColor: "#092168" }}
                  onClick={() => setAdminOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Registrar suministración
                </button>
              )}
              {isActive && (
                <button
                  type="button"
                  className="btn btn-sm text-[#4d3a00] border-[#fcbc13]"
                  style={{ backgroundColor: "#fef3c7" }}
                  onClick={() => setSuspenderOpen(true)}
                >
                  Suspender
                </button>
              )}
              {isSuspended && (
                <button
                  type="button"
                  className="btn btn-sm text-white shadow-sm"
                  style={{ backgroundColor: "#092168", borderColor: "#092168" }}
                  onClick={() => setReanudarOpen(true)}
                >
                  Reanudar
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm text-white"
                style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
                onClick={() => setFinalizarOpen(true)}
              >
                Finalizar
              </button>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
          <button type="submit">close</button>
        </form>
      </dialog>

      <RegisterAdministrationModal
        open={adminOpen}
        medicacion={medicacion}
        episodioId={episodioId}
        onClose={() => setAdminOpen(false)}
        onCreated={handleAdminCreated}
      />
      <SuspendMedicationModal
        open={suspenderOpen}
        medicacion={medicacion}
        episodioId={episodioId}
        onClose={() => setSuspenderOpen(false)}
        onUpdated={handleUpdated}
      />
      <ResumeMedicationModal
        open={reanudarOpen}
        medicacion={medicacion}
        episodioId={episodioId}
        onClose={() => setReanudarOpen(false)}
        onUpdated={handleUpdated}
      />
      <FinalizeMedicationModal
        open={finalizarOpen}
        medicacion={medicacion}
        episodioId={episodioId}
        onClose={() => setFinalizarOpen(false)}
        onUpdated={handleUpdated}
      />
    </>
  );
}

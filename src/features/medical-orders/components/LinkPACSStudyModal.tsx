"use client";
import { useEffect, useRef, useState } from "react";
import { getEpisodeById } from "@/features/patients/services/episodeService";
import {
  getOrthancStudies,
  getPatientStudies,
} from "@/features/patients/services/medicalImagesService";
import { linkPACSStudy } from "@/features/medical-orders/services/medicalOrdersService";
import { toast } from "@/lib/toast";
import type {
  OrdenMedicaDto,
  EstudioOrthancDto,
} from "@/features/patients/types";

function formatDicomDate(fecha: string | null, hora: string | null): string {
  if (!fecha) return "—";
  try {
    const y = fecha.slice(0, 4);
    const m = fecha.slice(4, 6);
    const d = fecha.slice(6, 8);
    const base = `${d}/${m}/${y}`;
    if (!hora) return base;
    const h = hora.slice(0, 2);
    const min = hora.slice(2, 4);
    return `${base} ${h}:${min}`;
  } catch { return fecha; }
}

type Step = "loading" | "list" | "confirming" | "success" | "error";

interface Props {
  orden: OrdenMedicaDto;
  onClose: () => void;
  onVinculado: (descripcion: string | null) => void;
}

export function LinkPACSStudyModal({ orden, onClose, onVinculado }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [step, setStep] = useState<Step>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [estudios, setEstudios] = useState<EstudioOrthancDto[]>([]);
  const [selected, setSelected] = useState<EstudioOrthancDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [linkedDescripcion, setLinkedDescripcion] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    void init();
  }, []);

  async function init() {
    setStep("loading");
    try {
      const episodio = await getEpisodeById(orden.episodioId);
      setPacienteId(episodio.pacienteId);
      setHospitalId(episodio.hospitalId);

      const [orthanc, registros] = await Promise.all([
        getOrthancStudies(episodio.pacienteId),
        getPatientStudies(episodio.pacienteId, 1, 200),
      ]);

      const vinculados = new Set(
        registros.datos
          .filter((e) => e.ordenMedicaId !== null)
          .map((e) => e.orthancStudyId)
          .filter(Boolean),
      );

      const disponibles = orthanc.filter(
        (e) => !e.orthancStudyId || !vinculados.has(e.orthancStudyId),
      );

      setEstudios(disponibles);
      setStep("list");
    } catch {
      setErrorMsg(
        "No se pudo obtener la información del episodio o los estudios de Orthanc.",
      );
      toast.error("No se pudo cargar la información para vincular estudios PACS.");
      setStep("error");
    }
  }

  async function handleLink() {
    if (!selected?.orthancStudyId || pacienteId == null || hospitalId == null) return;
    setSaving(true);
    setActionError(null);
    try {
      const fechaIso = selected.fecha
        ? new Date(
            `${selected.fecha.slice(0, 4)}-${selected.fecha.slice(4, 6)}-${selected.fecha.slice(6, 8)}T00:00:00.000Z`,
          ).toISOString()
        : null;
      await linkPACSStudy(orden.id, {
        ordenId: orden.id,
        pacienteId,
        hospitalId,
        orthancStudyId: selected.orthancStudyId,
        tipoEstudio: selected.modalidades.join(", ") || (orden.categoria ?? "Imagen"),
        descripcion: selected.descripcion ?? null,
        fechaEstudio: fechaIso,
      });
      setLinkedDescripcion(selected.descripcion ?? null);
      toast.success("Estudio PACS vinculado correctamente.");
      setStep("success");
    } catch {
      setActionError("No se pudo vincular el estudio. Intente nuevamente.");
      toast.error("No se pudo vincular el estudio PACS.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    dialogRef.current?.close();
    if (step === "success") {
      onVinculado(linkedDescripcion);
    } else {
      onClose();
    }
  }

  function handleSuccess() {
    dialogRef.current?.close();
    onVinculado(linkedDescripcion);
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#1A2B5E]">
              Vincular estudio PACS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Orden #{orden.id}
              {orden.descripcion ? ` — ${orden.descripcion}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost flex-shrink-0"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {step === "loading" && (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-md text-[#09268E]" />
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
            <p className="text-sm text-red-600">{errorMsg}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-sm btn-outline" onClick={() => void init()}>
                Reintentar
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Confirming */}
        {step === "confirming" && selected && (
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth="2" stroke="#d97706" className="size-5 flex-shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Esta acción no se puede deshacer
                </p>
                <p className="text-sm text-amber-700">
                  Una vez vinculado el estudio a esta orden, la decisión es permanente y no podrá modificarse.
                </p>
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">Estudio seleccionado</p>
              <p className="text-sm font-semibold text-[#1e293b]">
                {selected.descripcion ?? <span className="text-slate-400 font-normal">Sin descripción</span>}
              </p>
              <p className="text-xs text-slate-500">
                {formatDicomDate(selected.fecha, selected.hora)}
                {selected.modalidades.length > 0 && ` · ${selected.modalidades.join(", ")}`}
              </p>
            </div>

            {actionError && (
              <div role="alert" className="alert alert-error text-sm py-2.5">
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => setStep("list")}>
                Volver
              </button>
              <button type="button"
                disabled={saving}
                onClick={() => void handleLink()}
                className="btn btn-sm text-white disabled:opacity-60"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}>
                {saving ? <span className="loading loading-spinner loading-xs" /> : null}
                Confirmar vinculación
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth="2" stroke="#059669" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1A2B5E]">Estudio vinculado correctamente.</p>
            <button type="button" className="btn btn-sm text-white"
              style={{ backgroundColor: "#09268E" }} onClick={handleSuccess}>
              Aceptar
            </button>
          </div>
        )}

        {/* Study list */}
        {step === "list" && (
          <>
            {estudios.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">
                No hay estudios disponibles para vincular. Todos los estudios de este paciente ya están vinculados a una orden.
              </div>
            ) : (
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden mb-4">
                <table className="table table-sm w-full [&_td]:py-2.5 [&_th]:py-2">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                      <th className="w-8" />
                      <th className="text-xs font-semibold uppercase tracking-wide">Fecha</th>
                      <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                      <th className="text-xs font-semibold uppercase tracking-wide">Modalidades</th>
                      <th className="text-xs font-semibold uppercase tracking-wide">Series</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudios.map((e) => {
                      const isSelected = selected?.orthancStudyId === e.orthancStudyId;
                      return (
                        <tr
                          key={e.orthancStudyId ?? Math.random()}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                          onClick={() => setSelected(isSelected ? null : e)}
                        >
                          <td>
                            <input
                              type="radio"
                              className="radio radio-xs"
                              style={{ accentColor: "#09268E" }}
                              checked={isSelected}
                              onChange={() => setSelected(e)}
                              onClick={(ev) => ev.stopPropagation()}
                            />
                          </td>
                          <td className="text-sm text-slate-700 whitespace-nowrap">
                            {formatDicomDate(e.fecha, e.hora)}
                          </td>
                          <td className="text-sm text-[#1e293b] max-w-[180px] truncate">
                            {e.descripcion ?? <span className="text-slate-400">—</span>}
                          </td>
                          <td className="text-sm text-slate-500">
                            {e.modalidades.length > 0
                              ? e.modalidades.join(", ")
                              : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="text-sm text-slate-500 text-center">
                            {e.numeroDeSeries}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="modal-action mt-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selected || !selected.orthancStudyId}
                onClick={() => setStep("confirming")}
                className="btn btn-sm text-white disabled:opacity-50"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              >
                Vincular estudio
              </button>
            </div>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}

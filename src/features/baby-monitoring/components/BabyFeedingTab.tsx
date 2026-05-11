"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBabyFeedings,
  createBabyFeeding,
} from "@/features/baby-monitoring/services/babyService";
import { toast } from "@/lib/toast";
import {
  TipoAlimentacion,
  TIPO_ALIMENTACION_LABELS,
} from "@/features/baby-monitoring/types";
import type {
  RegistroAlimentacion,
  CreateRegistroAlimentacionDTO,
} from "@/features/baby-monitoring/types";

interface BabyFeedingTabProps {
  episodioId: number;
  readOnly: boolean;
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
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

// ─── Modal de registro ────────────────────────────────────────────────────────

interface FeedingModalProps {
  open: boolean;
  episodioId: number;
  onClose: () => void;
  onCreated: (registro: RegistroAlimentacion) => void;
}

function FeedingModal({ open, episodioId, onClose, onCreated }: FeedingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tipo, setTipo] = useState<TipoAlimentacion>(TipoAlimentacion.LecheMaterna);
  const [cantidad, setCantidad] = useState("");
  const [ahora, setAhora] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setTipo(TipoAlimentacion.LecheMaterna);
      setCantidad("");
      setAhora(new Date().toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const cantidadNum = parseFloat(cantidad);
  const isValid = !isNaN(cantidadNum) && cantidadNum > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const dto: CreateRegistroAlimentacionDTO = {
        tipoAlimentacion: tipo,
        cantidadMl: cantidadNum,
      };
      const saved = await createBabyFeeding(episodioId, dto);
      toast.success("Registro de alimentación creado.");
      onCreated(saved);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo guardar el registro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}
    >
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Registrar alimentación</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Tipo de alimentación <span className="text-red-500">*</span>
            </label>
            <select
              className="select select-bordered w-full text-sm"
              value={tipo}
              onChange={(e) => setTipo(Number(e.target.value) as TipoAlimentacion)}
              disabled={submitting}
            >
              {(Object.values(TipoAlimentacion).filter((v) => typeof v === "number") as TipoAlimentacion[]).map((val) => (
                <option key={val} value={val}>{TIPO_ALIMENTACION_LABELS[val]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Cantidad (ml) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="input input-bordered w-full text-sm"
              placeholder="Ej. 30"
              min={0.1}
              step={0.1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={submitting}
            />
            {cantidad && !isValid && (
              <p className="text-xs text-red-500 mt-1">La cantidad debe ser mayor a 0.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Fecha y hora de registro
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="#64748b" className="size-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm text-[#475569] font-medium">{ahora}</span>
              <span className="text-xs text-slate-400 ml-auto">Automático</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={!isValid || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!isValid || submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}

// Compoentente principal de la pestaña de alimentación del bebé, con listado de registros y 
// modal para crear nuevos registros

export function BabyFeedingTab({ episodioId, readOnly }: BabyFeedingTabProps) {
  const [registros, setRegistros] = useState<RegistroAlimentacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBabyFeedings(episodioId);
      setRegistros([...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch {
      setError("No se pudieron cargar los registros de alimentación.");
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => { void loadData(); }, [loadData]);

  function handleCreated(registro: RegistroAlimentacion) {
    setRegistros((prev) =>
      [registro, ...prev].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    );
  }

  return (
    <>
    <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#0f172a]">Alimentación</h2>
            {!loading && !error && (
              <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
                {registros.length}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn text-white"
            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
            onClick={() => { setShowModal(true); }}
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
            Registrar alimentación
          </button>
        </div>
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        

        {readOnly && (
          <div className="mx-6 mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
            <p className="text-xs text-slate-500">Bebé dado de alta. Los registros se muestran en modo historial.</p>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void loadData()}>Reintentar</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full table-fixed [&_td]:py-2.5 [&_th]:py-2.5">
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
              <col className="w-[30%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Fecha</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Tipo</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Cantidad</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : !error && registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-base-content/40 text-sm">
                    No hay registros de alimentación para este bebé.
                  </td>
                </tr>
              ) : (
                registros.map((r) => (
                  <tr key={r.id} className="hover:bg-base-200">
                    <td className="text-sm text-[#475569] whitespace-nowrap">{formatDateTime(r.fecha)}</td>
                    <td className="text-sm text-[#475569] truncate">{TIPO_ALIMENTACION_LABELS[r.tipoAlimentacion]}</td>
                    <td className="text-sm text-[#475569] whitespace-nowrap">{r.cantidadMl} ml</td>
                    <td className="text-sm text-[#475569] truncate">{r.alimentadoPorNombre}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FeedingModal
        open={showModal}
        episodioId={episodioId}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { createOrden } from "@/features/patients/services/ordenService";
import {
  TipoOrden,
  TIPO_ORDEN_LABELS,
  OrdenPrioridad,
  ORDEN_PRIORIDAD_CONFIG,
  CATEGORIAS_POR_TIPO,
  type EpisodioHistorial,
} from "@/features/patients/types";
import { toast } from "@/lib/toast";

interface CreateOrdenModalProps {
  open: boolean;
  episodio: EpisodioHistorial;
  onClose: () => void;
  onCreated: () => void;
}

// Funcion para crear una nueva orden médica dentro de un episodio. 
// Se muestra como un modal con un formulario que incluye campos para tipo de orden, categoría, prioridad y descripción. 
export function CreateOrdenModal({
  open,
  episodio,
  onClose,
  onCreated,
}: CreateOrdenModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [tipo, setTipo] = useState<TipoOrden>(TipoOrden.Laboratorio);
  const [categoria, setCategoria] = useState<string>(
    CATEGORIAS_POR_TIPO[TipoOrden.Laboratorio][0],
  );
  const [prioridad, setPrioridad] = useState<OrdenPrioridad>(
    OrdenPrioridad.Normal,
  );
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setTipo(TipoOrden.Laboratorio);
      setCategoria(CATEGORIAS_POR_TIPO[TipoOrden.Laboratorio][0]);
      setPrioridad(OrdenPrioridad.Normal);
      setDescripcion("");
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function handleTipoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTipo = parseInt(e.target.value) as TipoOrden;
    setTipo(newTipo);
    setCategoria(CATEGORIAS_POR_TIPO[newTipo][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) return;
    setSubmitting(true);
    try {
      await createOrden(episodio.id, {
        descripcion: descripcion.trim(),
        tipoOrden: tipo,
        categoria,
        prioridad,
        costoTotal: 0,
      });
      toast.success("Orden médica creada correctamente.");
      onCreated();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensaje?: string; message?: string } } })
          ?.response?.data?.mensaje ??
        (err as { response?: { data?: { mensaje?: string; message?: string } } })
          ?.response?.data?.message ??
        "No se pudo crear la orden. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] relative flex-shrink-0">
          <h3 className="text-lg font-bold text-[#0f172a]">Crear orden médica</h3>
          
          <button
            type="button"
            className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle text-[#64748b]"
            onClick={onClose}
            disabled={submitting}
          >
           X
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Tipo + Categoría */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                  Tipo de orden <span className="text-[#ff627d]">*</span>
                </label>
                <select
                  className={"select select-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"}
                  value={tipo}
                  onChange={handleTipoChange}
                  disabled={submitting}
                  required
                >
                  {(Object.entries(TIPO_ORDEN_LABELS) as [string, string][]).map(
                    ([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                  Categoría <span className="text-[#ff627d]">*</span>
                </label>
                <select
                  className={"select select-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={submitting}
                  required
                >
                  {CATEGORIAS_POR_TIPO[tipo].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prioridad */}
            <div>
              <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                Prioridad <span className="text-[#ff627d]">*</span>
              </label>
              <select
                className={"select select-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"}
                value={prioridad}
                onChange={(e) =>
                  setPrioridad(parseInt(e.target.value) as OrdenPrioridad)
                }
                disabled={submitting}
                required
              >
                {(
                  Object.entries(ORDEN_PRIORIDAD_CONFIG) as [
                    string,
                    { label: string },
                  ][]
                ).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                Descripción <span className="text-[#ff627d]">*</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none resize-none leading-relaxed"
                rows={5}
                placeholder="Describa los detalles de la orden médica..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Resumen */}
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
                  Paciente
                </p>
                <p className="text-sm font-semibold text-[#334155] truncate">
                  {episodio.pacienteNombre}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
                  Área
                </p>
                <p className="text-sm font-semibold text-[#334155]">
                  {episodio.areaNombre}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-sm border-[#e2e8f0] text-[#475569] bg-white"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white shadow-sm"
              style={{ backgroundColor: "#092168", borderColor: "#092168" }}
              disabled={submitting}
            >
              {submitting && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Crear orden médica
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMedicationsForDropdown } from "@/features/administration/medications/services/medicationsService";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import type { RecetaAltaDetalle } from "@/features/patients/types";
import type { MedicamentoAdmin } from "@/features/administration/medications/types";
import { toast } from "@/lib/toast";



interface RecetaRow {
  uid: string;
  medicamentoId: number | null;
  medicamentoSearch: string;
  showDropdown: boolean;
  dosis: string;
  frecuencia: string;
  duracion: string;
  instrucciones: string;
  errors: Record<string, string>;
}

export interface RecetaDisplayItem extends RecetaAltaDetalle {
  medicamentoLabel: string;
}

function makeRow(): RecetaRow {
  return {
    uid: Math.random().toString(36).slice(2),
    medicamentoId: null,
    medicamentoSearch: "",
    showDropdown: false,
    dosis: "",
    frecuencia: "",
    duracion: "",
    instrucciones: "",
    errors: {},
  };
}

function buildLabel(m: MedicamentoAdmin): string {
  return m.concentracion ? `${m.nombreComercial} — ${m.concentracion}` : m.nombreComercial;
}



interface Props {
  open: boolean;
  onClose: () => void;
  onConfirmar: (items: RecetaDisplayItem[]) => void;
  initialItems?: RecetaDisplayItem[] | null;
}

// Componente modal para crear la receta de alta, con búsqueda de medications y validación de campos.


export function DischargeModal({ open, onClose, onConfirmar, initialItems }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [medications, setMedicamentos] = useState<MedicamentoAdmin[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [rows, setRows] = useState<RecetaRow[]>([makeRow()]);
  const [submitting, setSubmitting] = useState(false);

  // Cargar medications al abrir
  useEffect(() => {
    if (!open) return;
    setMedLoading(true);
    getMedicationsForDropdown(undefined, 1, 200)
      .then((meds) => {
        setMedicamentos(meds);

        if (initialItems && initialItems.length > 0) {
          setRows(
            initialItems.map((item) => {
              const med = meds.find((m) => m.id === item.medicamentoId);
              return {
                uid: Math.random().toString(36).slice(2),
                medicamentoId: item.medicamentoId,
                medicamentoSearch: med ? buildLabel(med) : item.medicamentoLabel,
                showDropdown: false,
                dosis: item.dosis,
                frecuencia: item.frecuencia,
                duracion: item.duracion,
                instrucciones: item.instrucciones,
                errors: {},
              };
            }),
          );
        } else {
          setRows([makeRow()]);
        }
      })
      .catch(() => {
        setRows([makeRow()]);
        toast.error("No se pudieron cargar los medications para la receta.");
      })
      .finally(() => setMedLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  // Funciones para manejar cambios en las filas de la receta (medicamento, dosis, frecuencia, duración, instrucciones) y para agregar/eliminar filas.

  function updateRow(uid: string, patch: Partial<RecetaRow>) {
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  function removeRow(uid: string) {
    setRows((prev) => prev.filter((r) => r.uid !== uid));
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  // Función para obtener las opciones de medications filtradas según el texto de búsqueda en cada fila.

  function getOptions(search: string) {
    const q = search.toLowerCase().trim();
    return medications
      .filter(
        (m) =>
          !q ||
          m.nombreComercial.toLowerCase().includes(q) ||
          (m.concentracion ?? "").toLowerCase().includes(q),
      )
      .slice(0, 40)
      .map((m) => ({
        id: m.id,
        label: m.nombreComercial,
        sublabel: m.concentracion ?? undefined,
      }));
  }

  // Función de validación que revisa que cada fila tenga un medicamento seleccionado y que los campos de dosis, frecuencia y duración no estén vacíos.

  function validate(): boolean {
    const validated = rows.map((row) => {
      const e: Record<string, string> = {};
      if (!row.medicamentoId) e.medicamento = "Seleccione un medicamento.";
      if (!row.dosis.trim()) e.dosis = "Requerido.";
      if (!row.frecuencia.trim()) e.frecuencia = "Requerido.";
      if (!row.duracion.trim()) e.duracion = "Requerido.";
      return { ...row, errors: e };
    });
    setRows(validated);
    return validated.every((row) => Object.keys(row.errors).length === 0);
  }



  function handleSubmit() {
    if (!validate()) {
      toast.error("Complete los campos obligatorios de la receta.");
      return;
    }
    setSubmitting(true);
    const items: RecetaDisplayItem[] = rows.map((row) => ({
      medicamentoId: row.medicamentoId!,
      dosis: row.dosis.trim(),
      frecuencia: row.frecuencia.trim(),
      duracion: row.duracion.trim(),
      instrucciones: row.instrucciones.trim(),
      medicamentoLabel: row.medicamentoSearch,
    }));
    toast.success("Receta de alta preparada correctamente.");
    onConfirmar(items);
    setSubmitting(false);
  }


  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-2xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">

        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="#2563eb"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Receta de alta</h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Agregue los medications que se recetan al paciente al momento del alta.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle text-[#64748b]"
            onClick={onClose}
            disabled={submitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="size-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>


        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
          {rows.map((row, idx) => (
            <div
              key={row.uid}
              className="rounded-xl border border-[#e2e8f0] bg-[#fafafa] p-5"
            >

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#1A2B5E]">
                  Medicamento {idx + 1}
                </span>
                <button
                    type="button"
                    className="btn btn-xs btn-ghost text-[#94a3b8] hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeRow(row.uid)}
                    disabled={submitting}
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                    Eliminar
                  </button>
              </div>


              <div className="mb-4">
                <SearchableSelect
                  id={`receta-med-${row.uid}`}
                  label="Nombre del medicamento"
                  required
                  variant="modal"
                  options={getOptions(row.medicamentoSearch)}
                  loading={medLoading}
                  selectedId={row.medicamentoId}
                  searchValue={row.medicamentoSearch}
                  onSearchChange={(e) =>
                    updateRow(row.uid, {
                      medicamentoSearch: e.target.value,
                      medicamentoId: null,
                      errors: { ...row.errors, medicamento: "" },
                    })
                  }
                  onSelect={(opt) => {
                    const med = medications.find((m) => m.id === opt.id);
                    updateRow(row.uid, {
                      medicamentoId: opt.id,
                      medicamentoSearch: med ? buildLabel(med) : opt.label,
                      showDropdown: false,
                      errors: { ...row.errors, medicamento: "" },
                    });
                  }}
                  showDropdown={row.showDropdown}
                  onFocus={() => updateRow(row.uid, { showDropdown: true })}
                  onBlur={() => updateRow(row.uid, { showDropdown: false })}
                  placeholder="Buscar medicamento..."
                  emptyText="No se encontraron medications."
                  error={row.errors.medicamento}
                  onClear={() =>
                    updateRow(row.uid, { medicamentoId: null, medicamentoSearch: "" })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                    Dosis <span className="text-[#ff627d]">*</span>
                  </label>
                  <input
                    type="text"
                    className={`${"input input-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"} ${row.errors.dosis ? "input-error" : ""}`}
                    placeholder="Ej: 500 mg"
                    value={row.dosis}
                    onChange={(e) =>
                      updateRow(row.uid, {
                        dosis: e.target.value,
                        errors: { ...row.errors, dosis: "" },
                      })
                    }
                    disabled={submitting}
                  />
                  {row.errors.dosis && (
                    <p className="text-xs text-error mt-1">{row.errors.dosis}</p>
                  )}
                </div>
                <div>
                  <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                    Frecuencia <span className="text-[#ff627d]">*</span>
                  </label>
                  <input
                    type="text"
                    className={`${"input input-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"} ${row.errors.frecuencia ? "input-error" : ""}`}
                    placeholder="Ej: cada 8 horas"
                    value={row.frecuencia}
                    onChange={(e) =>
                      updateRow(row.uid, {
                        frecuencia: e.target.value,
                        errors: { ...row.errors, frecuencia: "" },
                      })
                    }
                    disabled={submitting}
                  />
                  {row.errors.frecuencia && (
                    <p className="text-xs text-error mt-1">{row.errors.frecuencia}</p>
                  )}
                </div>
                <div>
                  <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>
                    Duración <span className="text-[#ff627d]">*</span>
                  </label>
                  <input
                    type="text"
                    className={`${"input input-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"} ${row.errors.duracion ? "input-error" : ""}`}
                    placeholder="Ej: 7 días"
                    value={row.duracion}
                    onChange={(e) =>
                      updateRow(row.uid, {
                        duracion: e.target.value,
                        errors: { ...row.errors, duracion: "" },
                      })
                    }
                    disabled={submitting}
                  />
                  {row.errors.duracion && (
                    <p className="text-xs text-error mt-1">{row.errors.duracion}</p>
                  )}
                </div>
              </div>
              <div>
                <label className={"block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5"}>Instrucciones</label>
                <input
                  type="text"
                  className={"input input-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"}
                  placeholder="Ej: Tomar con bastante agua"
                  value={row.instrucciones}
                  onChange={(e) =>
                    updateRow(row.uid, { instrucciones: e.target.value })
                  }
                  disabled={submitting}
                />
              </div>
            </div>
          ))}


          <button
            type="button"
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#e2e8f0] text-sm font-semibold text-[#64748b] hover:border-[#09268E] hover:text-[#09268E] hover:bg-[#f0f4ff] transition-colors flex items-center justify-center gap-2"
            onClick={addRow}
            disabled={submitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar medicamento
          </button>
        </div>


        <div className="px-7 py-5 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-sm border-[#e2e8f0] text-[#64748b] bg-white"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-sm text-white"
            style={{ backgroundColor: "#092168", borderColor: "#092168" }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            Confirmar receta
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}

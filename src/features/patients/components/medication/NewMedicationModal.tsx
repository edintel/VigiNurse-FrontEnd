"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createMedication } from "@/features/patients/services/medicationService";
import { getMedicamentosForDropdown } from "@/features/administration/medicamentos/services/medicamentosService";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import type { Medicacion } from "@/features/patients/types";
import { loadSession } from "@/lib/session";
import { toast } from "@/lib/toast";
import type { MedicamentoAdmin } from "@/features/administration/medicamentos/types";

type SelectOption = { id: number; label: string; sublabel?: string };

interface Props {
  open: boolean;
  episodioId: number;
  onClose: () => void;
  onCreated: (m: Medicacion) => void;
}

function formatNowPreview(): string {
  return new Date().toLocaleString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Modal para crear una nueva medicación asociada al episodio activo del paciente. Incluye búsqueda de medicamento, dosis, frecuencia, etc.
export function NewMedicationModal({ open, episodioId, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Medicamento search
  const [medicamentos, setMedicamentos] = useState<MedicamentoAdmin[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [medSelectedId, setMedSelectedId] = useState<number | null>(null);
  const [medShowDropdown, setMedShowDropdown] = useState(false);
  const [medLoading, setMedLoading] = useState(false);
  const [medFetchError, setMedFetchError] = useState<string | undefined>();
  const [medReloadToken, setMedReloadToken] = useState(0);

  // Form fields
  const [dosis, setDosis] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("mg");
  const [frecuenciaHoras, setFrecuenciaHoras] = useState("");
  const [fechaInicioPreview, setFechaInicioPreview] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const profesional = loadSession()?.user.name ?? "—";

  // Debounced server-side search
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setMedLoading(true);
    setMedFetchError(undefined);
    const t = setTimeout(() => {
      getMedicamentosForDropdown(medSearch || undefined, 1, 50, controller.signal)
        .then(setMedicamentos)
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const msg =
            (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data?.mensaje ??
            (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data?.message ??
            "No se pudieron cargar los medicamentos.";
          setMedFetchError(msg);
          setMedicamentos([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setMedLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [medSearch, open, medReloadToken]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setMedSearch(""); setMedSelectedId(null); setMedShowDropdown(false);
      setDosis(""); setUnidadMedida("mg"); setFrecuenciaHoras("");
      setFechaInicioPreview(formatNowPreview());
      setErrors({});
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const medOptions = useMemo<SelectOption[]>(
    () => medicamentos.map((m) => ({ id: m.id, label: `${m.nombreGenerico} ${ `- ${m.concentracion}`}` })),
    [medicamentos],
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!medSelectedId) next.medicamento = "Seleccione un medicamento.";
    if (!dosis.trim() || isNaN(parseFloat(dosis)) || parseFloat(dosis) <= 0) next.dosis = "Ingrese una dosis válida.";
    if (!unidadMedida.trim()) next.unidadMedida = "Ingrese la unidad.";
    if (!frecuenciaHoras.trim() || isNaN(parseInt(frecuenciaHoras)) || parseInt(frecuenciaHoras) <= 0) next.frecuenciaHoras = "Ingrese la frecuencia en horas.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !medSelectedId) return;
    setSubmitting(true);
    try {
      const med = await createMedication(episodioId, {
        medicamentoId: medSelectedId,
        dosis: parseFloat(dosis),
        unidadMedida: unidadMedida.trim(),
        frecuenciaHoras: parseInt(frecuenciaHoras),
        fechaInicio: new Date().toISOString(),
      });
      toast.success("Medicación registrada.");
      onCreated(med);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data?.mensaje ??
        (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data?.message ??
        "No se pudo registrar la medicación.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "input input-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none";
  const labelCls = "block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5";

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">Nueva medicación</h3>
            <p className="text-sm text-[#64748b] mt-0.5">La medicación quedará asociada al episodio activo.</p>
          </div>
          <button type="button" className="btn btn-sm btn-ghost btn-circle text-[#64748b]" onClick={onClose} disabled={submitting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="px-7 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Medicamento */}
            <SearchableSelect
              id="nueva-med-medicamento"
              label="Nombre del medicamento"
              required
              variant="modal"
              options={medOptions}
              loading={medLoading}
              selectedId={medSelectedId}
              searchValue={medSearch}
              onSearchChange={(e) => { setMedSearch(e.target.value); setMedSelectedId(null); setErrors((p) => ({ ...p, medicamento: "" })); }}
              onSelect={(opt) => { setMedSelectedId(opt.id); setMedSearch(opt.label); setMedShowDropdown(false); setErrors((p) => ({ ...p, medicamento: "" })); }}
              showDropdown={medShowDropdown}
              onFocus={() => setMedShowDropdown(true)}
              onBlur={() => setMedShowDropdown(false)}
              placeholder="Buscar medicamento..."
              emptyText="No se encontraron medicamentos."
              error={errors.medicamento}
              fetchError={medFetchError}
              onRetry={() => setMedReloadToken((v) => v + 1)}
              onClear={() => { setMedSelectedId(null); setMedSearch(""); }}
            />

            {/* Dosis + Unidad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Dosis <span className="text-[#ff627d]">*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  className={`${inputCls} ${errors.dosis ? "input-error" : ""}`}
                  placeholder="Ej: 100"
                  value={dosis}
                  onChange={(e) => { setDosis(e.target.value); setErrors((p) => ({ ...p, dosis: "" })); }}
                  disabled={submitting}
                />
                {errors.dosis && <p className="text-xs text-error mt-1">{errors.dosis}</p>}
              </div>
              <div>
                <label className={labelCls}>Unidad <span className="text-[#ff627d]">*</span></label>
                <input
                  type="text"
                  className={`${inputCls} ${errors.unidadMedida ? "input-error" : ""}`}
                  placeholder="mg, ml, UI..."
                  value={unidadMedida}
                  onChange={(e) => { setUnidadMedida(e.target.value); setErrors((p) => ({ ...p, unidadMedida: "" })); }}
                  disabled={submitting}
                />
                {errors.unidadMedida && <p className="text-xs text-error mt-1">{errors.unidadMedida}</p>}
              </div>
            </div>

            {/* Frecuencia */}
            <div>
              <label className={labelCls}>Frecuencia <span className="text-[#ff627d]">*</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  className={`${inputCls} flex-1 ${errors.frecuenciaHoras ? "input-error" : ""}`}
                  placeholder="Ej: 8"
                  value={frecuenciaHoras}
                  onChange={(e) => { setFrecuenciaHoras(e.target.value); setErrors((p) => ({ ...p, frecuenciaHoras: "" })); }}
                  disabled={submitting}
                />
                <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm font-medium text-[#64748b] whitespace-nowrap">
                  Horas
                </div>
              </div>
              {errors.frecuenciaHoras && <p className="text-xs text-error mt-1">{errors.frecuenciaHoras}</p>}
            </div>

            {/* Fecha de inicio */}
            <div>
              <label className={labelCls}>Fecha de inicio</label>
              <input
                type="text"
                className={`${inputCls} opacity-75`}
                value={fechaInicioPreview || "Automática (al guardar)"}
                readOnly
                aria-readonly="true"
                disabled={submitting}
              />
              <p className="text-xs text-slate-500 mt-1">
                Se asigna automáticamente al momento de crear la medicación.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Médico prescriptor</p>
                <p className="text-sm font-semibold text-[#334155] truncate">{profesional}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Estado inicial</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-[#2563eb]">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  Activa
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex justify-end gap-2">
            <button type="button" className="btn btn-sm border-[#e2e8f0] text-[#64748b] bg-white" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn btn-sm text-white shadow-sm" style={{ backgroundColor: "#092168", borderColor: "#092168", boxShadow: "0 4px 6px -1px rgba(9,33,104,0.2)" }} disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Crear medicación
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}><button type="submit">close</button></form>
    </dialog>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { getVitalSignTypes } from "@/features/administration/vitalSigns/services/vitalSignsService";
import { createVitalSign } from "@/features/patients/services/vitalSignService";
import type { TipoSignoVital } from "@/features/administration/vitalSigns/types";
import type { SignoVital } from "@/features/patients/types";
import { loadSession } from "@/lib/session";
import { toast } from "@/lib/toast";


function normalizeName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
}

function isSystolicType(nombre: string) {
  return normalizeName(nombre).includes("sistol");
}

function isDiastolicType(nombre: string) {
  return normalizeName(nombre).includes("diastol");
}

function isBPType(nombre: string) {
  return isSystolicType(nombre) || isDiastolicType(nombre);
}

function isOutOfRange(valor: number, min: number, max: number) {
  return valor < min || valor > max;
}

function formatDatetime(d: Date): string {
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function OutOfRangeWarning({ min, max, unidad }: { min: number; max: number; unidad: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="#d97706"
        className="size-4 mt-0.5 flex-shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-[11px] text-[#b45309] leading-relaxed">
        Valor fuera del rango normal ({min} — {max} {unidad}). Se requiere observación.
      </p>
    </div>
  );
}


interface VitalSignFormModalProps {
  open: boolean;
  episodioId: number;
  onClose: () => void;
  onCreated: (signos: SignoVital[]) => void;
}

// Componente de modal para registrar un nuevo signo vital. Soporta presión arterial como caso especial (sistólica + diastólica).
export function VitalSignFormModal({
  open,
  episodioId,
  onClose,
  onCreated,
}: VitalSignFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [tipos, setTipos] = useState<TipoSignoVital[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);

  const [selectedTipoId, setSelectedTipoId] = useState<number | "bp" | "">("");
  const [valor, setValor] = useState("");
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registroFecha, setRegistroFecha] = useState<Date>(new Date());

  const tipoSistolica = tipos.find((t) => isSystolicType(t.nombre));
  const tipoDiastolica = tipos.find((t) => isDiastolicType(t.nombre));
  const hasBP = !!(tipoSistolica && tipoDiastolica);

  const regularTipos = tipos.filter((t) => !isBPType(t.nombre));

  const selectedTipo =
    selectedTipoId !== "" && selectedTipoId !== "bp"
      ? tipos.find((t) => t.id === selectedTipoId) ?? null
      : null;

  const isBPSelected = selectedTipoId === "bp";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setSelectedTipoId("");
      setValor("");
      setSistolica("");
      setDiastolica("");
      setErrors({});
      setRegistroFecha(new Date());
      setLoadingTipos(true);
      getVitalSignTypes()
        .then(setTipos)
        .catch(() => {
          setTipos([]);
          toast.error("No se pudieron cargar los tipos de signos vitales.");
        })
        .finally(() => setLoadingTipos(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (selectedTipoId === "") {
      next.tipo = "Seleccione un tipo de signo vital.";
    }
    if (isBPSelected) {
      if (!sistolica.trim() || isNaN(parseFloat(sistolica)))
        next.sistolica = "Ingrese un valor numérico.";
      if (!diastolica.trim() || isNaN(parseFloat(diastolica)))
        next.diastolica = "Ingrese un valor numérico.";
    } else {
      if (!valor.trim() || isNaN(parseFloat(valor)))
        next.valor = "Ingrese un valor numérico.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Revise los campos requeridos para registrar el signo vital.");
      return;
    }

    setSubmitting(true);
    try {
      const isoFecha = new Date().toISOString();
      const created: SignoVital[] = [];

      if (isBPSelected && tipoSistolica && tipoDiastolica) {
        const [sis, dia] = await Promise.all([
          createVitalSign(episodioId, {
            tipoSignoId: tipoSistolica.id,
            valor: parseFloat(sistolica),
            fecha: isoFecha,
          }),
          createVitalSign(episodioId, {
            tipoSignoId: tipoDiastolica.id,
            valor: parseFloat(diastolica),
            fecha: isoFecha,
          }),
        ]);
        created.push(sis, dia);
        toast.success("Presión arterial registrada correctamente.");
      } else if (selectedTipo) {
        const sv = await createVitalSign(episodioId, {
          tipoSignoId: selectedTipo.id,
          valor: parseFloat(valor),
          fecha: isoFecha,
        });
        created.push(sv);
        toast.success(`${selectedTipo.nombre} registrado correctamente.`);
      }

      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensaje?: string; message?: string } } })
          ?.response?.data?.mensaje ??
        (err as { response?: { data?: { mensaje?: string; message?: string } } })
          ?.response?.data?.message ??
        "No se pudo registrar el signo vital. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const profesional = loadSession()?.user.name ?? "—";

  const valorNum = parseFloat(valor);
  const sisNum = parseFloat(sistolica);
  const diaNum = parseFloat(diastolica);

  const showValueWarning =
    selectedTipo != null &&
    !isNaN(valorNum) &&
    isOutOfRange(valorNum, selectedTipo.minimoNormal, selectedTipo.maximoNormal);

  const showBPWarning =
    isBPSelected &&
    tipoSistolica &&
    tipoDiastolica &&
    ((!isNaN(sisNum) && isOutOfRange(sisNum, tipoSistolica.minimoNormal, tipoSistolica.maximoNormal)) ||
      (!isNaN(diaNum) && isOutOfRange(diaNum, tipoDiastolica.minimoNormal, tipoDiastolica.maximoNormal)));

  const selectCls =
    "select select-bordered w-full text-sm bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none";

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] relative flex-shrink-0">
          <h3 className="text-lg font-bold text-[#0f172a]">Registrar signo vital</h3>
          <p className="text-sm text-[#64748b] mt-0.5">
            Se asociará al episodio activo del paciente.
          </p>
          <button
            type="button"
            className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle text-[#64748b]"
            onClick={onClose}
            disabled={submitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Tipo de signo vital */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-1.5">
                Tipo de signo vital <span className="text-red-500">*</span>
              </label>
              {loadingTipos ? (
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <span className="loading loading-spinner loading-xs text-[#09268E]" />
                  Cargando tipos...
                </div>
              ) : (
                <select
                  className={`${selectCls} ${errors.tipo ? "select-error" : ""}`}
                  value={selectedTipoId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedTipoId(v === "bp" ? "bp" : v === "" ? "" : parseInt(v));
                    setValor("");
                    setSistolica("");
                    setDiastolica("");
                    setErrors((p) => ({ ...p, tipo: "" }));
                  }}
                >
                  <option value="">Seleccionar tipo...</option>
                  {hasBP && <option value="bp">Presión arterial</option>}
                  {regularTipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              )}
              {errors.tipo && <p className="text-xs text-error mt-1">{errors.tipo}</p>}
            </div>

            {/* BP inputs */}
            {isBPSelected && tipoSistolica && tipoDiastolica && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-1.5">
                  Presión arterial <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#64748b] mb-1">
                      Sistólica
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        className={`input input-bordered w-full text-sm pr-14 bg-white border-[#e2e8f0] ${errors.sistolica ? "input-error" : ""}`}
                        placeholder={String(tipoSistolica.minimoNormal)}
                        value={sistolica}
                        onChange={(e) => { setSistolica(e.target.value); setErrors((p) => ({ ...p, sistolica: "" })); }}
                        disabled={submitting}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5">
                        {tipoSistolica.unidad}
                      </span>
                    </div>
                    {errors.sistolica && <p className="text-xs text-error mt-1">{errors.sistolica}</p>}
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#64748b] mb-1">
                      Diastólica
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        className={`input input-bordered w-full text-sm pr-14 bg-white border-[#e2e8f0] ${errors.diastolica ? "input-error" : ""}`}
                        placeholder={String(tipoDiastolica.minimoNormal)}
                        value={diastolica}
                        onChange={(e) => { setDiastolica(e.target.value); setErrors((p) => ({ ...p, diastolica: "" })); }}
                        disabled={submitting}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5">
                        {tipoDiastolica.unidad}
                      </span>
                    </div>
                    {errors.diastolica && <p className="text-xs text-error mt-1">{errors.diastolica}</p>}
                  </div>
                </div>

                {showBPWarning && (
                  <div className="mt-2">
                    <OutOfRangeWarning
                      min={tipoSistolica.minimoNormal}
                      max={tipoSistolica.maximoNormal}
                      unidad={tipoSistolica.unidad}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Regular value input */}
            {selectedTipo && !isBPSelected && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-1.5">
                  Valor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className={`input input-bordered w-full text-sm pr-16 bg-white border-[#e2e8f0] ${errors.valor ? "input-error" : ""}`}
                    placeholder={`${selectedTipo.minimoNormal} – ${selectedTipo.maximoNormal}`}
                    value={valor}
                    onChange={(e) => { setValor(e.target.value); setErrors((p) => ({ ...p, valor: "" })); }}
                    disabled={submitting}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5">
                    {selectedTipo.unidad}
                  </span>
                </div>
                {errors.valor && <p className="text-xs text-error mt-1">{errors.valor}</p>}
                {showValueWarning && (
                  <div className="mt-2">
                    <OutOfRangeWarning
                      min={selectedTipo.minimoNormal}
                      max={selectedTipo.maximoNormal}
                      unidad={selectedTipo.unidad}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer — always visible */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0">
            {/* Registration info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg border border-[#e2e8f0] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-0.5">
                  Registrado por
                </p>
                <p className="text-sm font-semibold text-[#0f172a] truncate">{profesional}</p>
              </div>
              <div className="bg-white rounded-lg border border-[#e2e8f0] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-0.5">
                  Fecha y hora
                </p>
                <p className="text-sm font-semibold text-[#0f172a]">{formatDatetime(registroFecha)}</p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2">
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
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                disabled={submitting}
              >
                {submitting && <span className="loading loading-spinner loading-xs" />}
                Registrar signo vital
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { createPaciente } from "@/features/patients/services/patientService";
import { Sexo, TIPOS_SANGRE } from "@/features/patients/types";
import type { Paciente } from "@/features/patients/types";
import { toast } from "@/lib/toast";

interface CreatePatientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (paciente: Paciente) => void;
  onContactRequested: (pacienteId: number) => void;
}

type ModalStep = "form" | "contact_prompt";

// Modal para crear un nuevo paciente. Después de crear el paciente, pregunta si se desea agregar un contacto de emergencia.
export function CreatePatientModal({
  open,
  onClose,
  onCreated,
  onContactRequested,
}: CreatePatientModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [step, setStep] = useState<ModalStep>("form");
  const [createdId, setCreatedId] = useState<number | null>(null);

  // Campos del formulario
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState<Sexo>(Sexo.Masculino);
  const [tipoSangre, setTipoSangre] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [telefono, setTelefono] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      resetAll();
    }
  }, [open]);

  function resetAll() {
    setStep("form");
    setCreatedId(null);
    setCedula("");
    setNombre("");
    setApellidos("");
    setFechaNacimiento("");
    setSexo(Sexo.Masculino);
    setTipoSangre("");
    setPeso("");
    setAltura("");
    setTelefono("");
    setErrors({});
  }

  // Validación básica antes de enviar al backend. El backend también validará, pero esto mejora la UX.
  async function handleSubmitPaciente(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!cedula.trim()) newErrors.cedula = "La cédula es obligatoria.";
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!apellidos.trim()) newErrors.apellidos = "Los apellidos son obligatorios.";
    if (!fechaNacimiento) newErrors.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    if (!tipoSangre) newErrors.tipoSangre = "El tipo de sangre es obligatorio.";
    const pesoNum = parseFloat(peso);
    if (!peso || isNaN(pesoNum) || pesoNum <= 0)
      newErrors.peso = "Ingrese un peso válido en kg.";
    const alturaNum = parseFloat(altura);
    if (!altura || isNaN(alturaNum) || alturaNum <= 0)
      newErrors.altura = "Ingrese una altura válida en cm.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const paciente = await createPaciente({
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        fechaNacimiento: new Date(fechaNacimiento).toISOString(),
        sexo,
        tipoSangre,
        peso: pesoNum,
        altura: alturaNum,
        telefono: telefono.trim(),
      });
      toast.success(`Paciente "${paciente.nombre} ${paciente.apellidos}" registrado exitosamente.`);
      onCreated(paciente);
      setCreatedId(paciente.id);
      setStep("contact_prompt");
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo registrar el paciente. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }


  const selectCls =
    "select select-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Paso 1: Formulario de paciente */}
        {step === "form" && (
          <>
            <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
              Registrar nuevo paciente
            </h3>

            <form onSubmit={(e) => void handleSubmitPaciente(e)} noValidate className="flex flex-col gap-4">
              {/* Fila 1: Nombre · Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Nombre"
                  id="create-paciente-nombre"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrors((p) => ({ ...p, nombre: "" }));
                  }}
                  placeholder="Ej. María"
                  error={errors.nombre}
                  required
                />
                <InputField
                  label="Apellidos"
                  id="create-paciente-apellidos"
                  value={apellidos}
                  onChange={(e) => {
                    setApellidos(e.target.value);
                    setErrors((p) => ({ ...p, apellidos: "" }));
                  }}
                  placeholder="Ej. González Pérez"
                  error={errors.apellidos}
                  required
                />
              </div>

              {/* Fila 2: Cédula · Fecha de nacimiento */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Cédula"
                  id="create-paciente-cedula"
                  value={cedula}
                  onChange={(e) => {
                    setCedula(e.target.value);
                    setErrors((p) => ({ ...p, cedula: "" }));
                  }}
                  placeholder="Ej. 208440805"
                  error={errors.cedula}
                  required
                />
                <CallyDatePicker
                  id="create-paciente-fecha"
                  label="Fecha de nacimiento"
                  value={fechaNacimiento}
                  onChange={(v) => {
                    setFechaNacimiento(v);
                    setErrors((p) => ({ ...p, fechaNacimiento: "" }));
                  }}
                  placeholder="DD/MM/AAAA"
                  error={errors.fechaNacimiento}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  variant="modal"
                />
              </div>

              {/* Fila 3: Teléfono */}
              <InputField
                label="Teléfono"
                id="create-paciente-telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. +506 8888-8888"
              />

              {/* Fila 4: Sexo · Tipo de sangre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label pb-1" htmlFor="create-paciente-sexo">
                    <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                      Sexo <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    id="create-paciente-sexo"
                    className={selectCls}
                    value={sexo}
                    onChange={(e) => setSexo(Number(e.target.value) as Sexo)}
                  >
                    <option value={Sexo.Masculino}>Masculino</option>
                    <option value={Sexo.Femenino}>Femenino</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label pb-1" htmlFor="create-paciente-sangre">
                    <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                      Tipo de sangre <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    id="create-paciente-sangre"
                    className={`${selectCls} ${errors.tipoSangre ? "select-error" : ""}`}
                    value={tipoSangre}
                    onChange={(e) => {
                      setTipoSangre(e.target.value);
                      setErrors((p) => ({ ...p, tipoSangre: "" }));
                    }}
                  >
                    <option value="" disabled>Seleccionar tipo...</option>
                    {TIPOS_SANGRE.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.tipoSangre && (
                    <label className="label pt-1">
                      <span className="label-text-alt text-error">{errors.tipoSangre}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Fila 5: Peso · Altura */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="Peso (kg)"
                  id="create-paciente-peso"
                  type="number"
                  min="0"
                  step="0.1"
                  value={peso}
                  onChange={(e) => {
                    setPeso(e.target.value);
                    setErrors((p) => ({ ...p, peso: "" }));
                  }}
                  placeholder="Ej. 70"
                  error={errors.peso}
                  required
                />
                <InputField
                  label="Altura (cm)"
                  id="create-paciente-altura"
                  type="number"
                  min="0"
                  step="1"
                  value={altura}
                  onChange={(e) => {
                    setAltura(e.target.value);
                    setErrors((p) => ({ ...p, altura: "" }));
                  }}
                  placeholder="Ej. 172"
                  error={errors.altura}
                  required
                />
              </div>

              <div className="modal-action mt-1">
                <button
                  type="button"
                  className="btn text-white"
                  style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn text-white"
                  style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                  disabled={loading}
                >
                  {loading && <span className="loading loading-spinner loading-sm" />}
                  {loading ? "Registrando..." : "Registrar paciente"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Paso 2: Confirmar si desea agregar contacto */}
        {step === "contact_prompt" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="#00d390"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#1A2B5E]">Paciente registrado</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                ¿Desea agregar información de contacto de emergencia para este
                paciente? Puede hacerlo más adelante si lo prefiere.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn btn-ghost btn-sm font-semibold text-slate-500"
                onClick={onClose}
              >
                No, omitir
              </button>
              <button
                type="button"
                className="btn btn-sm text-white font-semibold"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                onClick={() => {
                  onClose();
                  if (createdId !== null) onContactRequested(createdId);
                }}
              >
                Sí, agregar contacto
              </button>
            </div>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { updatePatient } from "@/features/patients/services/patientService";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentRole } from "@/store/slices/authSlice";
import { Sexo, TIPOS_SANGRE } from "@/features/patients/types";
import type { Paciente, UpdatePacienteDTO } from "@/features/patients/types";

interface EditVitalsModalProps {
  open: boolean;
  paciente: Paciente;
  onClose: () => void;
  onUpdated: (paciente: Paciente) => void;
}

// Modal para editar los datos del paciente. Los administradores pueden editar
// también nombre, apellidos y tipo de sangre; el resto solo peso, altura y teléfono.
export function EditVitalsModal({
  open,
  paciente,
  onClose,
  onUpdated,
}: EditVitalsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const currentRole = useAppSelector(selectCurrentRole);
  const isAdmin = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";

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
  const [apiError, setApiError] = useState<string | null>(null);

  const selectCls =
    "select select-bordered w-full bg-[#FFFFFF] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setCedula(paciente.cedula ?? "");
      setNombre(paciente.nombre ?? "");
      setApellidos(paciente.apellidos ?? "");
      setFechaNacimiento(paciente.fechaNacimiento?.split("T")[0] ?? "");
      setSexo(paciente.sexo);
      setTipoSangre(paciente.tipoSangre ?? "");
      setPeso(String(paciente.peso));
      setAltura(String(paciente.altura));
      setTelefono(paciente.telefono ?? "");
      setErrors({});
      setApiError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [
    open,
    paciente.cedula,
    paciente.nombre,
    paciente.apellidos,
    paciente.fechaNacimiento,
    paciente.sexo,
    paciente.tipoSangre,
    paciente.peso,
    paciente.altura,
    paciente.telefono,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);

    if (!peso || isNaN(pesoNum) || pesoNum <= 0)
      newErrors.peso = "Ingrese un peso válido (kg).";
    if (!altura || isNaN(alturaNum) || alturaNum <= 0)
      newErrors.altura = "Ingrese una altura válida (cm).";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const dto: UpdatePacienteDTO = {
        nombre: nombre.trim() || null,
        apellidos: apellidos.trim() || null,
        tipoSangre: tipoSangre || null,
        peso: pesoNum,
        altura: alturaNum,
        telefono: telefono.trim(),
      };
      // La cédula, fecha de nacimiento y sexo solo las acepta el backend de roles Admin/SuperAdmin
      if (isAdmin) {
        dto.cedula = cedula.trim() || null;
        dto.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento).toISOString() : null;
        dto.sexo = sexo;
      }
      const updated = await updatePatient(paciente.id, dto);
      toast.success("Datos del paciente actualizados.");
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudieron actualizar los datos. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#FFFFFF] w-full max-w-md">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Editar datos del paciente
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="edit-vitals-cedula"
              label={
                <>
                  Cédula{" "}
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </>
              }
              value={cedula}
              onChange={(e) => {
                setCedula(e.target.value);
                setErrors((p) => ({ ...p, cedula: "" }));
              }}
              error={errors.cedula}
              disabled={!isAdmin}
            />
            <CallyDatePicker
              id="edit-vitals-fecha-nacimiento"
              label={
                <>
                  Fecha de nacimiento{" "}
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </>
              }
              value={fechaNacimiento}
              onChange={(v) => {
                setFechaNacimiento(v);
                setErrors((p) => ({ ...p, fechaNacimiento: "" }));
              }}
              error={errors.fechaNacimiento}
              disabled={!isAdmin}
              max={new Date().toISOString().split("T")[0]}
              variant="modal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="edit-vitals-nombre"
              label={
                <>
                  Nombre{" "}
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </>
              }
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrors((p) => ({ ...p, nombre: "" }));
              }}
              error={errors.nombre}
              disabled={!isAdmin}
            />
            <InputField
              id="edit-vitals-apellidos"
              label={
                <>
                  Apellidos{" "}
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </>
              }
              value={apellidos}
              onChange={(e) => {
                setApellidos(e.target.value);
                setErrors((p) => ({ ...p, apellidos: "" }));
              }}
              error={errors.apellidos}
              disabled={!isAdmin}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pb-1" htmlFor="edit-vitals-sexo">
                <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                  Sexo {isAdmin && <span className="text-error">*</span>}
                </span>
              </label>
              <select
                id="edit-vitals-sexo"
                className={selectCls}
                value={sexo}
                disabled={!isAdmin}
                onChange={(e) => setSexo(Number(e.target.value) as Sexo)}
              >
                <option value={Sexo.Masculino}>Masculino</option>
                <option value={Sexo.Femenino}>Femenino</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label pb-1" htmlFor="edit-vitals-tipo-sangre">
                <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                  Tipo de sangre{" "}
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </span>
              </label>
              <select
                id="edit-vitals-tipo-sangre"
                className={selectCls}
                value={tipoSangre}
                disabled={!isAdmin}
                onChange={(e) => setTipoSangre(e.target.value)}
              >
                <option value="">Sin registrar</option>
                {TIPOS_SANGRE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="edit-vitals-peso"
              label="Peso (kg)"
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={peso}
              onChange={(e) => {
                setPeso(e.target.value);
                setErrors((p) => ({ ...p, peso: "" }));
              }}
              error={errors.peso}
              required
            />
            <InputField
              id="edit-vitals-altura"
              label="Altura (cm)"
              type="number"
              min="50"
              max="300"
              step="1"
              value={altura}
              onChange={(e) => {
                setAltura(e.target.value);
                setErrors((p) => ({ ...p, altura: "" }));
              }}
              error={errors.altura}
              required
            />
          </div>
          <InputField
            id="edit-vitals-telefono"
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. +506 8888-8888"
          />

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
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

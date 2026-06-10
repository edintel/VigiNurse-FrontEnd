"use client";
import { useRef, useState, useEffect } from "react";
import { createPatientAccount } from "@/features/patients/services/patientService";
import { toast } from "@/lib/toast";
import type { Paciente } from "@/features/patients/types";
import { formatFullName } from "@/shared/utils/personName";

interface CreatePatientAccountModalProps {
  open: boolean;
  paciente: Paciente;
  onClose: () => void;
  onCreated: () => void;
}

// Modal para crear una cuenta de acceso para un paciente. 
// Se le pide al usuario que ingrese el correo electrónico del paciente, se valida y luego se llama a la API 
// para crear la cuenta. 
// Si tiene éxito, se muestra un mensaje de éxito y se cierra el modal después de un momento. 
// Si hay un error, se muestra el mensaje de error.
export function CreatePatientAccountModal({
  open,
  paciente,
  onClose,
  onCreated,
}: CreatePatientAccountModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setEmail("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  function validate(): boolean {
    if (!paciente.cedula) {
      setError("El paciente no tiene una cédula registrada. Asigne una cédula antes de crear la cuenta.");
      return false;
    }
    const trimmed = email.trim();
    if (!trimmed) { setError("El correo electrónico es obligatorio."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Ingrese un correo electrónico válido.");
      return false;
    }
    return true;
  }

  // Maneja el envío del formulario para crear la cuenta del paciente. 
  // Valida el correo electrónico, llama a la API y maneja el estado de carga, éxito y error.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !paciente.cedula) return;
    setLoading(true);
    setError(null);
    try {
      await createPatientAccount(paciente.cedula, email.trim());
      toast.success("Cuenta creada. Se envió un correo con las instrucciones de acceso.");
      setSuccess(true);
      onCreated();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      let message = "Error al crear la cuenta del paciente.";
      const data = (err as { response?: { data?: { mensaje?: string } } })
        ?.response?.data;
      if (data?.mensaje) message = data.mensaje;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-md p-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth="1.8" stroke="#2563eb" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#0f172a]">Crear cuenta de acceso</h3>
            <p className="text-xs text-[#64748b] truncate">
              {formatFullName(paciente.nombre, paciente.apellidos)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-[#64748b]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth="2" stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth="1.8" stroke="#2563eb" className="size-4 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <p className="text-xs text-[#1d4ed8] leading-relaxed">
              Se enviará un correo electrónico al paciente con las instrucciones
              para acceder a su cuenta en la aplicación.
            </p>
          </div>

          {success ? (
            <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth="2" stroke="#16a34a" className="size-5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-semibold text-[#16a34a]">
                Cuenta creada exitosamente.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[#64748b] text-[11px] font-bold uppercase tracking-[0.55px]">
                  Correo electrónico <span className="text-[#f43f5e]">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="paciente@ejemplo.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg w-full px-4 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#09268E] transition-colors"
                />
                {error && (
                  <p className="text-xs text-[#e11d48] mt-0.5">{error}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-sm text-[#475569]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sm text-white gap-1.5 disabled:opacity-60"
                  style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      strokeWidth="2" stroke="currentColor" className="size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  )}
                  Crear cuenta
                </button>
              </div>
            </>
          )}
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

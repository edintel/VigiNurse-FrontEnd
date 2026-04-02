"use client";
import { useState } from "react";
import { EditContactModal } from "@/features/patients/components/pacientes/EditContactModal";
import type { ContactoPaciente } from "@/features/patients/types";

interface PatientContactCardProps {
  pacienteId: number;
  contacto: ContactoPaciente | null;
  onUpdated: (contacto: ContactoPaciente) => void;
}

// Par etiqueta-valor reutilizable.
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[#334155]">{value}</span>
    </div>
  );
}

// Card con la información del contacto de emergencia del paciente.
export function PatientContactCard({
  pacienteId,
  contacto,
  onUpdated,
}: PatientContactCardProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="#64748b"
              className="size-4 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              Contacto de emergencia
            </span>
          </div>
          {contacto && (
            <button
              type="button"
              className="btn btn-xs btn-ghost gap-1.5 text-[#09268E]"
              onClick={() => setShowEdit(true)}
              title="Editar contacto"
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                />
              </svg>
              Editar
            </button>
          )}
        </div>

        {/* Card body */}
        <div className="p-5">
          {contacto ? (
            <div className="space-y-4">
              <Field
                label="Nombre completo"
                value={`${contacto.nombre} ${contacto.apellidos}`}
              />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Relación" value={contacto.relacion} />
                <Field label="Teléfono" value={contacto.telefono} />
              </div>
            </div>
          ) : (
            /* Estado vacío: sin contacto registrado */
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.4"
                  stroke="#94a3b8"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#334155]">
                  Sin contacto registrado
                </p>
                <p className="text-xs text-[#64748b] mt-0.5">
                  No hay un contacto de emergencia para este paciente.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm text-white gap-1.5 mt-1"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                onClick={() => setShowEdit(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="size-[1em]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Agregar contacto
              </button>
            </div>
          )}
        </div>
      </div>

      <EditContactModal
        open={showEdit}
        pacienteId={pacienteId}
        contacto={contacto}
        onClose={() => setShowEdit(false)}
        onSaved={(saved) => {
          onUpdated(saved);
          setShowEdit(false);
        }}
      />
    </>
  );
}

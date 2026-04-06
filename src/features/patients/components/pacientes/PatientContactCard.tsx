"use client";
import { useState } from "react";
import { EditContactModal } from "@/features/patients/components/pacientes/EditContactModal";
import type { ContactoPaciente } from "@/features/patients/types";

interface PatientContactCardProps {
  pacienteId: number;
  contacto: ContactoPaciente | null;
  onUpdated: (contacto: ContactoPaciente) => void;
}

function getInitials(nombre: string, apellidos: string) {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

export function PatientContactCard({
  pacienteId,
  contacto,
  onUpdated,
}: PatientContactCardProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden self-start">
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
        <div className="px-5 py-4">
          {contacto ? (
            <div className="flex items-center gap-4">
              {/* Avatar con iniciales */}
              <div className="w-10 h-10 rounded-full bg-[#e8edf8] flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#09268E]">
                  {getInitials(contacto.nombre, contacto.apellidos)}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0f172a] truncate">
                  {contacto.nombre} {contacto.apellidos}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-[#64748b]">{contacto.relacion}</span>
                  <span className="text-[#cbd5e1] text-xs">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#334155] font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-3 text-[#94a3b8]"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.5 2A1.5 1.5 0 0 0 2 3.5V5c0 5.523 4.477 10 10 10h1.5a1.5 1.5 0 0 0 1.5-1.5v-.957a1.5 1.5 0 0 0-1.136-1.457l-1.65-.413a1.5 1.5 0 0 0-1.502.478l-.375.501a7.046 7.046 0 0 1-3.99-3.99l.502-.375a1.5 1.5 0 0 0 .477-1.502l-.412-1.65A1.5 1.5 0 0 0 5.957 2H3.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {contacto.telefono}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Estado vacío */
            <div className="flex items-center gap-4 py-1">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.4"
                  stroke="#94a3b8"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#334155]">Sin contacto registrado</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">No hay un contacto de emergencia asignado.</p>
              </div>
              <button
                type="button"
                className="btn btn-xs text-white flex-shrink-0"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                onClick={() => setShowEdit(true)}
              >
                Agregar
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

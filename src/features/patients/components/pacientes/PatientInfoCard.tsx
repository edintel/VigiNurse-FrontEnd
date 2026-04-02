"use client";
import { useState } from "react";
import { EditVitalsModal } from "@/features/patients/components/pacientes/EditVitalsModal";
import { Sexo, SEXO_LABELS } from "@/features/patients/types";
import type { Paciente } from "@/features/patients/types";

interface PatientInfoCardProps {
  paciente: Paciente;
  onUpdated: (paciente: Paciente) => void;
}

// Formatea una fecha ISO a DD/MM/AAAA.
function fmt(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Par etiqueta-valor reutilizable dentro de las cards.
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

// Encabezado de sección dentro de la card.
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-1.5 border-b border-[#f1f5f9] mb-3">
      <span
        className="text-[10px] font-bold uppercase tracking-[1px]"
        style={{ color: "rgba(9,33,104,0.6)" }}
      >
        {children}
      </span>
    </div>
  );
}

// Card con la información personal y datos vitales del paciente.
export function PatientInfoCard({ paciente, onUpdated }: PatientInfoCardProps) {
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
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              Información del paciente
            </span>
          </div>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-1.5 text-[#09268E]"
            onClick={() => setShowEdit(true)}
            title="Editar datos vitales"
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
        </div>

        {/* Card body */}
        <div className="p-5 space-y-5">
          {/* Datos personales */}
          <div>
            <SectionHead>Datos personales</SectionHead>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Cédula" value={paciente.cedula} />
              <Field
                label="Nombre completo"
                value={`${paciente.nombre} ${paciente.apellidos}`}
              />
              <Field
                label="Fecha de nacimiento"
                value={fmt(paciente.fechaNacimiento)}
              />
              <Field
                label="Sexo"
                value={SEXO_LABELS[paciente.sexo as Sexo]}
              />
              <Field label="Tipo de sangre" value={paciente.tipoSangre} />
            </div>
          </div>

          {/* Datos vitales */}
          <div>
            <SectionHead>Datos vitales</SectionHead>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Peso" value={`${paciente.peso} kg`} />
              <Field label="Altura" value={`${paciente.altura} cm`} />
            </div>
          </div>

          {/* Estado del registro */}
          <div>
            <SectionHead>Estado del registro</SectionHead>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field
                label="Estado"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        paciente.activo ? "bg-green-500" : "bg-red-400"
                      }`}
                    />
                    {paciente.activo ? "Activo" : "Inactivo"}
                  </span>
                }
              />
              <Field
                label="Fecha de registro"
                value={fmt(paciente.fechaCreacion)}
              />
            </div>
          </div>
        </div>
      </div>

      <EditVitalsModal
        open={showEdit}
        paciente={paciente}
        onClose={() => setShowEdit(false)}
        onUpdated={(updated) => {
          onUpdated(updated);
          setShowEdit(false);
        }}
      />
    </>
  );
}

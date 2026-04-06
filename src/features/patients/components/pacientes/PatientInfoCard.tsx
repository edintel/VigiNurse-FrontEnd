"use client";
import { useState } from "react";
import { EditVitalsModal } from "@/features/patients/components/pacientes/EditVitalsModal";
import { EditContactModal } from "@/features/patients/components/pacientes/EditContactModal";
import { Sexo, SEXO_LABELS } from "@/features/patients/types";
import type { ContactoPaciente, Paciente } from "@/features/patients/types";

interface PatientInfoCardProps {
  paciente: Paciente;
  onUpdated: (paciente: Paciente) => void;
  contacto: ContactoPaciente | null;
  onContactUpdated: (contacto: ContactoPaciente) => void;
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
export function PatientInfoCard({
  paciente,
  onUpdated,
  contacto,
  onContactUpdated,
}: PatientInfoCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);

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
              <Field label="Teléfono" value={paciente.telefono ?? "—"} />
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

          {/* Contacto de emergencia */}
          <div>
            <div className="pb-1.5 border-b border-[#f1f5f9] mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
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
                <span
                  className="text-[10px] font-bold uppercase tracking-[1px] truncate"
                  style={{ color: "rgba(9,33,104,0.6)" }}
                >
                  Contacto de emergencia
                </span>
              </div>

              <button
                type="button"
                className={
                  contacto
                    ? "btn btn-xs btn-ghost gap-1.5 text-[#09268E]"
                    : "btn btn-xs text-white"
                }
                style={
                  contacto
                    ? undefined
                    : { backgroundColor: "#09268E", borderColor: "#09268E" }
                }
                onClick={() => setShowEditContact(true)}
                title={contacto ? "Editar contacto" : "Agregar contacto"}
              >
                {contacto ? (
                  <>
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
                  </>
                ) : (
                  "Agregar"
                )}
              </button>
            </div>

            {contacto ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field
                  label="Nombre"
                  value={`${contacto.nombre} ${contacto.apellidos}`}
                />
                <Field label="Parentesco" value={contacto.relacion} />
                <Field
                  label="Teléfono"
                  value={
                    <span className="font-mono text-sm font-semibold text-[#334155]">
                      {contacto.telefono}
                    </span>
                  }
                />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
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
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#334155]">
                    Sin contacto registrado
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    Agregue un contacto de emergencia para este paciente.
                  </p>
                </div>
              </div>
            )}
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

      <EditContactModal
        open={showEditContact}
        pacienteId={paciente.id}
        contacto={contacto}
        onClose={() => setShowEditContact(false)}
        onSaved={(saved) => {
          onContactUpdated(saved);
          setShowEditContact(false);
        }}
      />
    </>
  );
}

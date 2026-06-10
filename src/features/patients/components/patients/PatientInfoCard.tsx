"use client";
import { useState } from "react";
import { EditVitalsModal } from "@/features/patients/components/patients/EditVitalsModal";
import { EditContactModal } from "@/features/patients/components/patients/EditContactModal";
import { CreatePatientAccountModal } from "@/features/patients/components/patients/CreatePatientAccountModal";
import { deletePatientContact } from "@/features/patients/services/patientService";
import { toast } from "@/lib/toast";
import { Sexo, SEXO_LABELS } from "@/features/patients/types";
import type { ContactoPaciente, Paciente } from "@/features/patients/types";
import { formatFullName } from "@/shared/utils/personName";

interface PatientInfoCardProps {
  paciente: Paciente;
  onUpdated: (paciente: Paciente) => void;
  contactos: ContactoPaciente[];
  onContactsUpdated: (contactos: ContactoPaciente[]) => void;
  onAccountCreated?: () => void;
  canEditPatient?: boolean;
  canManageContact?: boolean;
  canCreatePatientAccount?: boolean;
}

// Formatea una fecha ISO a DD/MM/AAAA.
function fmt(dateStr: string | null): string {
  if (!dateStr) return "---";
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
  contactos,
  onContactsUpdated,
  onAccountCreated,
  canEditPatient = true,
  canManageContact = true,
  canCreatePatientAccount = true,
}: PatientInfoCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [editTarget, setEditTarget] = useState<ContactoPaciente | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactoPaciente | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteContact() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatientContact(paciente.id, deleteTarget.id);
      toast.success("Contacto eliminado.");
      onContactsUpdated(contactos.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("No se pudo eliminar el contacto.");
    } finally {
      setDeleting(false);
    }
  }

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
          <div className="flex items-center gap-1.5">
            {paciente.usuarioId !== null ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-[10px] font-bold uppercase tracking-[0.5px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth="2.5" stroke="currentColor" className="size-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Tiene cuenta
              </span>
            ) : canCreatePatientAccount ? (
              <button
                type="button"
                className="btn btn-xs gap-1.5 text-white"
                style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
                onClick={() => setShowCreateAccount(true)}
                title="Crear cuenta de acceso para el paciente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth="2" stroke="currentColor" className="size-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                Crear cuenta
              </button>
            ) : null}
            {canEditPatient && (
              <button
                type="button"
                className="btn btn-xs btn-ghost gap-1.5 text-[#09268E]"
                onClick={() => setShowEdit(true)}
                title="Editar datos del paciente"
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
        </div>

        {/* Card body */}
        <div className="p-5 space-y-5">
          {/* Datos personales */}
          <div>
            <SectionHead>Datos personales</SectionHead>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Cédula" value={paciente.cedula || "---"} />
              <Field
                label="Nombre completo"
                value={formatFullName(paciente.nombre, paciente.apellidos)}
              />
              <Field
                label="Fecha de nacimiento"
                value={fmt(paciente.fechaNacimiento)}
              />
              <Field
                label="Sexo"
                value={SEXO_LABELS[paciente.sexo as Sexo]}
              />
              <Field label="Tipo de sangre" value={paciente.tipoSangre || "---"} />
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

          {/* Contactos de emergencia */}
          <div>
            <div className="pb-1.5 border-b border-[#f1f5f9] mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="#64748b" className="size-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[1px] truncate" style={{ color: "rgba(9,33,104,0.6)" }}>
                  Contactos de emergencia
                </span>
                {contactos.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#09268E]/10 text-[#09268E]">
                    {contactos.length}
                  </span>
                )}
              </div>
              {canManageContact && (
                <button
                  type="button"
                  className="btn btn-xs text-white gap-1"
                  style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                  onClick={() => setEditTarget("new")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Agregar
                </button>
              )}
            </div>

            {/* Confirmación de borrado inline */}
            {deleteTarget && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                </svg>
                <p className="flex-1 text-xs text-red-700">
                  ¿Eliminar a <strong>{deleteTarget.nombre} {deleteTarget.apellidos}</strong>?
                </p>
                <button className="btn btn-xs btn-ghost text-slate-600" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
                <button className="btn btn-xs btn-error text-white border-none" disabled={deleting} onClick={() => void handleDeleteContact()}>
                  {deleting && <span className="loading loading-spinner loading-xs" />}
                  Eliminar
                </button>
              </div>
            )}

            {contactos.length === 0 ? (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.4" stroke="#94a3b8" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#334155]">Sin contactos registrados</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Agregue uno o más contactos de emergencia para este paciente.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {contactos.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#f8fafc] border border-[#f1f5f9] group">
                    <div className="flex-1 min-w-0 grid grid-cols-3 gap-x-4">
                      <p className="text-sm font-bold text-[#0f172a] truncate">{c.nombre} {c.apellidos}</p>
                      <p className="text-sm text-slate-500 truncate">{c.relacion}</p>
                      <span className="font-mono text-sm font-semibold text-[#334155] truncate">{c.telefono}</span>
                    </div>
                    {canManageContact && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title="Editar contacto"
                          onClick={() => setEditTarget(c)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded text-[#09268E] hover:bg-[#eff6ff] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Eliminar contacto"
                          onClick={() => setDeleteTarget(c)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {canCreatePatientAccount && (
        <CreatePatientAccountModal
          open={showCreateAccount}
          paciente={paciente}
          onClose={() => setShowCreateAccount(false)}
          onCreated={() => {
            setShowCreateAccount(false);
            onAccountCreated?.();
          }}
        />
      )}

      {canEditPatient && (
        <EditVitalsModal
          open={showEdit}
          paciente={paciente}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            onUpdated(updated);
            setShowEdit(false);
          }}
        />
      )}

      {canManageContact && editTarget !== null && (
        <EditContactModal
          open={editTarget !== null}
          pacienteId={paciente.id}
          contacto={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(saved) => {
            if (editTarget === "new") {
              onContactsUpdated([...contactos, saved]);
            } else {
              onContactsUpdated(contactos.map((c) => c.id === saved.id ? saved : c));
            }
            setEditTarget(null);
          }}
        />
      )}
    </>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getAlergiasPaciente,
  deleteAlergia,
} from "@/features/patients/services/patientService";
import { AlergiaModal } from "@/features/patients/components/pacientes/AlergiaModal";
import { toast } from "@/lib/toast";
import {
  SeveridadAlergia,
  SEVERIDAD_CONFIG,
} from "@/features/patients/types";
import type { Alergia } from "@/features/patients/types";

interface PatientAllergyCardProps {
  pacienteId: number;
}

// Icono de advertencia para alergias.
function AllergyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

// Fila individual de alergia dentro de la card.
function AlergiaItem({
  alergia,
  onEdit,
  onDeleted,
}: {
  alergia: Alergia;
  onEdit: (a: Alergia) => void;
  onDeleted: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg =
    SEVERIDAD_CONFIG[alergia.severidad] ?? SEVERIDAD_CONFIG[SeveridadAlergia.Leve];

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAlergia(alergia.pacienteId, alergia.id);
      toast.success("Alergia eliminada.");
      onDeleted(alergia.id);
    } catch {
      toast.error("No se pudo eliminar la alergia. Intente nuevamente.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm border border-[#E2E8F0] ${cfg.leftBorderCls}`}
    >
      {/* Icono + contenido */}
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconBgCls}`}
        >
          <AllergyIcon className={`size-4 ${cfg.textCls}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#1e293b]">
              {alergia.alergeno}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.bgCls} ${cfg.borderCls} ${cfg.textCls}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-[13px] text-[#475569] mt-0.5 text-justify">
            <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8]">
              Reacción:{" "}
            </span>
            {alergia.reaccion}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {confirmDelete ? (
          <>
            <span className="text-xs text-[#64748b] mr-1 whitespace-nowrap">
              ¿Eliminar?
            </span>
            <button
              type="button"
              className="btn btn-xs text-white"
              style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                "Sí"
              )}
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-xs btn-ghost text-[#09268E]"
              title="Editar alergia"
              onClick={() => onEdit(alergia)}
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
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost text-red-500"
              title="Eliminar alergia"
              onClick={() => setConfirmDelete(true)}
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Card con el listado de alergias del paciente y controles CRUD.
export function PatientAllergyCard({ pacienteId }: PatientAllergyCardProps) {
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlergia, setEditingAlergia] = useState<Alergia | null>(null);

  const loadAlergias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlergiasPaciente(pacienteId);
      setAlergias(data);
    } catch {
      setError("No se pudieron cargar las alergias.");
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void loadAlergias();
  }, [loadAlergias]);

  function handleEdit(a: Alergia) {
    setEditingAlergia(a);
    setModalOpen(true);
  }

  function handleNew() {
    setEditingAlergia(null);
    setModalOpen(true);
  }

  function handleSaved(saved: Alergia) {
    setAlergias((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  function handleDeleted(id: number) {
    setAlergias((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AllergyIcon className="size-4 text-[#64748b] flex-shrink-0" />
            <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              Alergias
            </span>
            {!loading && !error && (
              <span className="text-[11px] font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
                {alergias.length}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-xs text-white gap-1.5"
            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
            onClick={handleNew}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="size-[0.85em]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Agregar
          </button>
        </div>

        {/* Card body */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          ) : error ? (
            <div role="alert" className="alert alert-error text-sm py-3">
              <span>{error}</span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => void loadAlergias()}
              >
                Reintentar
              </button>
            </div>
          ) : alergias.length === 0 ? (
            /* Estado vacío */
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <AllergyIcon className="size-6 text-[#94a3b8]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#334155]">
                  Sin alergias registradas
                </p>
                <p className="text-xs text-[#64748b] mt-0.5">
                  No hay alergias documentadas para este paciente.
                </p>
              </div>
              
            </div>
          ) : (
            /* Lista de alergias */
            <div className="flex flex-col gap-2">
              {alergias.map((a) => (
                <AlergiaItem
                  key={a.id}
                  alergia={a}
                  onEdit={handleEdit}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlergiaModal
        open={modalOpen}
        pacienteId={pacienteId}
        alergia={editingAlergia}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}

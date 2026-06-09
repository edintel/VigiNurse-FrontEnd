"use client";
import React, { useEffect, useRef, useState } from "react";
import { getRoles } from "@/features/administration/users/services/userManagementService";
import { updateUser } from "@/features/administration/users/services/userManagementService";
import { getAreas } from "@/features/staff-monitoring/services/areasService";
import type { PersonalMedico, Area } from "@/features/staff-monitoring/types";
import type { Role } from "@/features/administration/users/types";

interface Props {
  open: boolean;
  personal: PersonalMedico | null;
  onClose: () => void;
  onSuccess: () => void;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (e.response && typeof e.response === "object") {
      const r = e.response as Record<string, unknown>;
      if (r.data && typeof r.data === "object") {
        const d = r.data as Record<string, unknown>;
        if (typeof d.message === "string") return d.message;
        if (typeof d.title === "string") return d.title;
      }
    }
  }
  return fallback;
}

// Modal para editar el área asignada a un personal médico. Solo se encarga de eso, no permite editar otros datos.
export default function EditStaffAreaModal({ open, personal, onClose, onSuccess }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [areas, setAreas] = useState<Area[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setError(null);
      setSelectedAreaId(personal?.areaId ?? "");
      setLoadingData(true);
      Promise.all([getAreas(), getRoles()])
        .then(([a, r]) => { setAreas(a); setRoles(r); })
        .catch(() => setError("No se pudieron cargar los datos."))
        .finally(() => setLoadingData(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open, personal]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!personal) return;
    setSaving(true);
    setError(null);
    try {
      const rolesIds = roles
        .filter((r) => personal.roles.includes(r.nombre))
        .map((r) => r.id);

      await updateUser(personal.id, {
        nombre: personal.nombre,
        apellidos: personal.apellidos,
        cedula: personal.cedula,
        email: personal.email,
        especialidadId: personal.especialidadId,
        rolesIds,
        areaId: selectedAreaId === "" ? null : Number(selectedAreaId),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractApiError(err, "No se pudo actualizar el área. Intente nuevamente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={onClose}>
      <div className="modal-box max-w-sm">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-[#1A2B5E] mb-1">Editar área</h3>
        {personal && (
          <p className="text-sm text-slate-500 mb-4">
            {personal.nombre} {personal.apellidos}
          </p>
        )}

        {error && (
          <div role="alert" className="alert alert-error text-sm py-2 mb-3">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Área
            </label>
            {loadingData ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <span className="loading loading-spinner loading-xs" />
                Cargando áreas...
              </div>
            ) : (
              <select
                className="select select-bordered w-full text-sm"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Sin área asignada</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            )}
          </div>

          <div className="modal-action mt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={{ backgroundColor: "#09268E" }}
              disabled={saving || loadingData}
            >
              {saving ? <span className="loading loading-spinner loading-xs" /> : null}
              Guardar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

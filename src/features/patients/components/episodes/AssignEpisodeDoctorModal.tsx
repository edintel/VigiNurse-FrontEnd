"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { getMedicalStaff } from "@/features/staff-monitoring/services/medicalStaffService";
import { assignPrimaryDoctor, changeCurrentDoctor } from "@/features/patients/services/episodeService";
import type { PersonalMedico } from "@/features/staff-monitoring/types";
import type { EpisodioHistorial } from "@/features/patients/types";
import { toast } from "@/lib/toast";

interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface AssignEpisodeDoctorModalProps {
  open: boolean;
  episodioId: number;
  mode: "principal" | "actual";
  currentDoctorId?: number | null;
  currentDoctorName?: string | null;
  onClose: () => void;
  onUpdated: (episodio: EpisodioHistorial) => void;
}

// Modal para asignar o cambiar el médico principal o actual de un episodio. 
// El comportamiento se define según la prop "mode":
export function AssignEpisodeDoctorModal({
  open,
  episodioId,
  mode,
  currentDoctorId,
  currentDoctorName,
  onClose,
  onUpdated,
}: AssignEpisodeDoctorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [doctors, setDoctors] = useState<PersonalMedico[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorSelectedId, setDoctorSelectedId] = useState<number | null>(null);
  const [doctorShowDropdown, setDoctorShowDropdown] = useState(false);

  const [motivoCambio, setMotivoCambio] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasDoctor = !!currentDoctorId;
  const title =
    mode === "principal"
      ? hasDoctor ? "Cambiar médico principal" : "Asignar médico principal"
      : hasDoctor ? "Cambiar médico actual" : "Asignar médico actual";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      loadDoctors();
    } else {
      dialogRef.current?.close();
      resetForm();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadDoctors() {
    setDoctorsLoading(true);
    setDoctorsError(null);
    getMedicalStaff(1, 100, { rol: "Doctor" })
      .then((res) => setDoctors(res.datos))
      .catch(() => setDoctorsError("No se pudieron cargar los doctores."))
      .finally(() => setDoctorsLoading(false));
  }

  function resetForm() {
    setDoctorSearch("");
    setDoctorSelectedId(null);
    setDoctorShowDropdown(false);
    setMotivoCambio("");
    setApiError(null);
    setErrors({});
  }

  const doctorOptions: SelectOption[] = useMemo(
    () =>
      doctors.map((d) => ({
        id: d.id,
        label: `${d.nombre} ${d.apellidos}`,
        sublabel: [d.nombreEspecialidad, d.nombreArea].filter(Boolean).join(" · "),
      })),
    [doctors],
  );

  const filteredDoctors = useMemo(
    () =>
      doctorOptions.filter((o) =>
        o.label.toLowerCase().includes(doctorSearch.toLowerCase()),
      ),
    [doctorOptions, doctorSearch],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (doctorSelectedId === null) newErrors.doctor = "Seleccione un médico.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      let updated: EpisodioHistorial;
      if (mode === "principal") {
        updated = await assignPrimaryDoctor(episodioId, { doctorId: doctorSelectedId! });
      } else {
        updated = await changeCurrentDoctor(episodioId, {
          doctorId: doctorSelectedId!,
          motivoCambio: motivoCambio.trim() || null,
        });
      }
      toast.success(
        mode === "principal"
          ? "Médico principal actualizado."
          : "Médico actual actualizado.",
      );
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })
        ?.response?.data;
      const msg = data?.mensaje ?? data?.message ?? "No se pudo actualizar el médico. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-lg overflow-visible">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-1">{title}</h3>
        {currentDoctorName && (
          <p className="text-xs text-[#64748b] mb-4">
            Actualmente: <span className="font-semibold text-[#1A2B5E]">{currentDoctorName}</span>
          </p>
        )}

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {doctorsError ? (
            <div role="alert" className="alert alert-warning text-sm py-3">
              <span>{doctorsError}</span>
              <button type="button" className="btn btn-xs btn-ghost" onClick={loadDoctors}>
                Reintentar
              </button>
            </div>
          ) : (
            <SearchableSelect
              id="assign-doctor-select"
              label="Médico"
              required
              variant="modal"
              options={filteredDoctors}
              loading={doctorsLoading}
              selectedId={doctorSelectedId}
              searchValue={doctorSearch}
              onSearchChange={(e) => {
                setDoctorSearch(e.target.value);
                setErrors((p) => ({ ...p, doctor: "" }));
              }}
              onSelect={(opt) => {
                setDoctorSelectedId(opt.id);
                setDoctorSearch(opt.label);
                setDoctorShowDropdown(false);
                setErrors((p) => ({ ...p, doctor: "" }));
              }}
              showDropdown={doctorShowDropdown}
              onFocus={() => setDoctorShowDropdown(true)}
              onBlur={() => setDoctorShowDropdown(false)}
              placeholder="Buscar médico..."
              loadingText="Cargando doctores..."
              emptyText="No hay doctores disponibles."
              error={errors.doctor}
              onClear={() => {
                setDoctorSelectedId(null);
                setDoctorSearch("");
              }}
            />
          )}

          {mode === "actual" && (
            <div className="form-control w-full">
              <label className="label pb-1" htmlFor="assign-doctor-motivo">
                <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                  Motivo del cambio <span className="text-[#94a3b8] font-normal">(opcional)</span>
                </span>
              </label>
              <textarea
                id="assign-doctor-motivo"
                rows={3}
                className="textarea textarea-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none resize-none"
                placeholder="Indique el motivo del cambio de médico..."
                value={motivoCambio}
                onChange={(e) => setMotivoCambio(e.target.value)}
              />
            </div>
          )}

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
              disabled={loading || doctorsLoading}
            >
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? "Guardando..." : "Guardar"}
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

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { createEpisode, assignPrimaryDoctor } from "@/features/patients/services/episodeService";
import { getPatients } from "@/features/patients/services/patientService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { getPersonalMedico } from "@/features/staff-monitoring/services/personalMedicoService";
import {
  TriageNivel,
  TipoEpisodio,
  TIPO_EPISODIO_LABELS,
} from "@/features/patients/types";
import { toast } from "@/lib/toast";

interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface CreateEpisodeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialPacienteId?: number;
  initialPacienteName?: string;
}

// Modal para registrar un nuevo episodio, seleccionando primero el paciente.
export function CreateEpisodeModal({
  open,
  onClose,
  onCreated,
  initialPacienteId,
  initialPacienteName,
}: CreateEpisodeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Campos del formulario
  const [tipo, setTipo] = useState<TipoEpisodio>(TipoEpisodio.Urgencia);
  const [nivelTriage, setNivelTriage] = useState<TriageNivel>(TriageNivel.NoAplica);
  const [razonVisita, setRazonVisita] = useState("");

  // Paciente SearchableSelect
  const [pacienteOptions, setPacienteOptions] = useState<SelectOption[]>([]);
  const [pacienteSearch, setPacienteSearch] = useState("");
  const [pacienteSelectedId, setPacienteSelectedId] = useState<number | null>(null);
  const [pacienteShowDropdown, setPacienteShowDropdown] = useState(false);
  const [pacienteLoading, setPacienteLoading] = useState(false);

  // Área SearchableSelect
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaSelectedId, setAreaSelectedId] = useState<number | null>(null);
  const [areaShowDropdown, setAreaShowDropdown] = useState(false);

  // Médico principal SearchableSelect
  const [medicoOptions, setMedicoOptions] = useState<SelectOption[]>([]);
  const [medicoSearch, setMedicoSearch] = useState("");
  const [medicoSelectedId, setMedicoSelectedId] = useState<number | null>(null);
  const [medicoShowDropdown, setMedicoShowDropdown] = useState(false);
  const [medicoLoading, setMedicoLoading] = useState(false);

  // Estado UI
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      loadData();
      if (initialPacienteId != null) {
        setPacienteSelectedId(initialPacienteId);
        setPacienteSearch(initialPacienteName ?? "");
      }
    } else {
      dialogRef.current?.close();
      resetForm();
    }

  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga pacientes y áreas para los select al abrir el modal
  function loadData() {
    setPacienteLoading(true);
    getPatients(1, 100)
      .then((res) =>
        setPacienteOptions(
          res.datos.map((p) => ({
            id: p.id,
            label: `${p.nombre} ${p.apellidos}`,
            sublabel: p.cedula,
          })),
        ),
      )
      .catch(() => {
        toast.error("No se pudieron cargar los pacientes.");
      })
      .finally(() => setPacienteLoading(false));

    getAreas(1, 200)
      .then((res) =>
        setAreaOptions(res.datos.map((a) => ({ id: a.id, label: a.nombre }))),
      )
      .catch(() => {
        toast.error("No se pudieron cargar las áreas disponibles.");
      });

    setMedicoLoading(true);
    getPersonalMedico(1, 100, { rol: "Doctor" })
      .then((res) =>
        setMedicoOptions(
          res.datos.map((d) => ({
            id: d.id,
            label: `${d.nombre} ${d.apellidos}`,
            sublabel: [d.nombreEspecialidad, d.nombreArea].filter(Boolean).join(" · "),
          })),
        ),
      )
      .catch(() => {/* optional, no hard error */})
      .finally(() => setMedicoLoading(false));
  }

  function resetForm() {
    setTipo(TipoEpisodio.Urgencia);
    setNivelTriage(TriageNivel.NoAplica);
    setRazonVisita("");
    setPacienteSearch("");
    setPacienteSelectedId(null);
    setAreaSearch("");
    setAreaSelectedId(null);
    setMedicoSearch("");
    setMedicoSelectedId(null);
    setErrors({});
    setApiError(null);
  }

  const filteredPatients = useMemo(
    () =>
      pacienteOptions.filter(
        (p) =>
          p.label.toLowerCase().includes(pacienteSearch.toLowerCase()) ||
          (p.sublabel && p.sublabel.includes(pacienteSearch)),
      ),
    [pacienteOptions, pacienteSearch],
  );

  const filteredAreas = useMemo(
    () =>
      areaOptions.filter((a) =>
        a.label.toLowerCase().includes(areaSearch.toLowerCase()),
      ),
    [areaOptions, areaSearch],
  );

  const filteredMedicos = useMemo(
    () =>
      medicoOptions.filter((m) =>
        m.label.toLowerCase().includes(medicoSearch.toLowerCase()),
      ),
    [medicoOptions, medicoSearch],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (pacienteSelectedId === null) newErrors.paciente = "Seleccione un paciente.";
    if (!razonVisita.trim()) newErrors.razonVisita = "La razón de visita es obligatoria.";
    if (areaSelectedId === null) newErrors.area = "Seleccione un área.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Complete los campos obligatorios del episodio.");
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const episodio = await createEpisode(pacienteSelectedId!, {
        fechaAdmision: new Date().toISOString(),
        tipo,
        nivelTriage,
        razonVisita: razonVisita.trim(),
        areaId: areaSelectedId!,
        hospitalId: null,
      });

      if (medicoSelectedId !== null) {
        try {
          await assignPrimaryDoctor(episodio.id, { doctorId: medicoSelectedId });
        } catch {
          toast.warning("Episodio creado, pero no se pudo asignar el médico principal.");
        }
      }

      toast.success("Episodio registrado exitosamente.");
      onCreated();
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo registrar el episodio. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Componente auxiliar para las etiquetas de los selects, con soporte para campo requerido
  function SelectLabel({
    htmlFor,
    text,
    required,
  }: {
    htmlFor: string;
    text: string;
    required?: boolean;
  }) {
    return (
      <label className="label pb-1" htmlFor={htmlFor}>
        <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
          {text} {required && <span className="text-red-500">*</span>}
        </span>
      </label>
    );
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-2xl">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Registrar nuevo episodio
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Paciente — campo de búsqueda o solo lectura cuando se pre-rellena */}
          {initialPacienteId != null ? (
            <div className="form-control w-full">
              <SelectLabel htmlFor="create-episodio-paciente" text="Paciente" required />
              <div
                id="create-episodio-paciente"
                className="input input-bordered h-12 w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] flex items-center text-sm opacity-75 cursor-default select-none"
              >
                {initialPacienteName}
              </div>
            </div>
          ) : (
            <SearchableSelect
              id="create-episodio-paciente"
              label="Paciente"
              required
              variant="modal"
              options={filteredPatients}
              loading={pacienteLoading}
              selectedId={pacienteSelectedId}
              searchValue={pacienteSearch}
              onSearchChange={(e) => {
                setPacienteSearch(e.target.value);
                setErrors((p) => ({ ...p, paciente: "" }));
              }}
              onSelect={(opt) => {
                setPacienteSelectedId(opt.id);
                setPacienteSearch(opt.label);
                setPacienteShowDropdown(false);
                setErrors((p) => ({ ...p, paciente: "" }));
              }}
              showDropdown={pacienteShowDropdown}
              onFocus={() => setPacienteShowDropdown(true)}
              onBlur={() => setPacienteShowDropdown(false)}
              placeholder="Buscar paciente por nombre o cédula..."
              loadingText="Cargando pacientes..."
              emptyText="No se encontraron pacientes."
              error={errors.paciente}
              onClear={() => {
                setPacienteSelectedId(null);
                setPacienteSearch("");
              }}
            />
          )}

          {/* Área */}
          <SearchableSelect
            id="create-episodio-area"
            label="Área / Sala"
            required
            variant="modal"
            options={filteredAreas}
            selectedId={areaSelectedId}
            searchValue={areaSearch}
            onSearchChange={(e) => {
              setAreaSearch(e.target.value);
              setErrors((p) => ({ ...p, area: "" }));
            }}
            onSelect={(opt) => {
              setAreaSelectedId(opt.id);
              setAreaSearch(opt.label);
              setAreaShowDropdown(false);
              setErrors((p) => ({ ...p, area: "" }));
            }}
            showDropdown={areaShowDropdown}
            onFocus={() => setAreaShowDropdown(true)}
            onBlur={() => setAreaShowDropdown(false)}
            placeholder="Seleccionar área..."
            emptyText="No se encontraron áreas."
            error={errors.area}
            onClear={() => {
              setAreaSelectedId(null);
              setAreaSearch("");
            }}
          />

          {/* Médico principal */}
          <SearchableSelect
            id="create-episodio-medico"
            label="Médico principal"
            variant="modal"
            options={filteredMedicos}
            loading={medicoLoading}
            selectedId={medicoSelectedId}
            searchValue={medicoSearch}
            onSearchChange={(e) => setMedicoSearch(e.target.value)}
            onSelect={(opt) => {
              setMedicoSelectedId(opt.id);
              setMedicoSearch(opt.label);
              setMedicoShowDropdown(false);
            }}
            showDropdown={medicoShowDropdown}
            onFocus={() => setMedicoShowDropdown(true)}
            onBlur={() => setMedicoShowDropdown(false)}
            placeholder="Seleccionar médico (opcional)..."
            loadingText="Cargando médicos..."
            emptyText="No hay doctores disponibles."
            onClear={() => {
              setMedicoSelectedId(null);
              setMedicoSearch("");
            }}
          />

          {/* Fila: Tipo episodio · Nivel triage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control w-full">
              <SelectLabel htmlFor="create-episodio-tipo" text="Tipo de episodio" required />
              <select
                id="create-episodio-tipo"
                className={"select select-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none"}
                value={tipo}
                onChange={(e) => setTipo(parseInt(e.target.value) as TipoEpisodio)}
              >
                {Object.entries(TIPO_EPISODIO_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control w-full">
              <SelectLabel htmlFor="create-episodio-triage" text="Nivel de triage" required />
              <select
                id="create-episodio-triage"
                className={"select select-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none"}
                value={nivelTriage}
                onChange={(e) => setNivelTriage(parseInt(e.target.value) as TriageNivel)}
              >
                <option value={TriageNivel.NoAplica}>0 — No aplica</option>
                <option value={TriageNivel.NoUrgente}>5 — No urgente</option>
                <option value={TriageNivel.Prioritario}>4 — Prioritario</option>
                <option value={TriageNivel.Urgencia}>3 — Urgencia</option>
                <option value={TriageNivel.Emergencia}>2 — Emergencia</option>
                <option value={TriageNivel.Reanimacion}>1 — Reanimación</option>
              </select>
            </div>
          </div>

          {/* Razón de visita */}
          <div className="form-control w-full">
            <SelectLabel htmlFor="create-episodio-razon" text="Razón de visita" required />
            <textarea
              id="create-episodio-razon"
              rows={3}
              className={`textarea textarea-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none resize-none ${
                errors.razonVisita ? "textarea-error" : ""
              }`}
              placeholder="Describa el motivo de la visita..."
              value={razonVisita}
              onChange={(e) => {
                setRazonVisita(e.target.value);
                setErrors((p) => ({ ...p, razonVisita: "" }));
              }}
            />
            {errors.razonVisita && (
              <label className="label pt-1">
                <span className="label-text-alt text-error">{errors.razonVisita}</span>
              </label>
            )}
          </div>

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
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? "Registrando..." : "Registrar episodio"}
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

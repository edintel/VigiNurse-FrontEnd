"use client";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { crearMonitorPaciente } from "@/features/vitals-monitoring/services/monitorService";
import { getTiposActivos } from "@/features/administration/assetTypes/services/assetTypeService";
import { getActivos } from "@/features/assets-managment/inventory/services/assetService";
import { toast } from "@/lib/toast";
import type { CrearMonitorPacienteDto, MonitorPacienteDto } from "@/features/vitals-monitoring/types";
import type { Paciente, PaginatedPacientes } from "@/features/patients/types";
import type { Activo } from "@/features/assets-managment/inventory/types";

interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface Props {
  onVinculado: (monitor: MonitorPacienteDto) => void;
  onCancelar: () => void;
}

function normalizeText(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Modal form para vincular un paciente con un monitor existente, con campos de búsqueda y manejo de errores
export function VinculacionForm({ onVinculado, onCancelar }: Props) {
  const [pacOptions, setPacOptions] = useState<SelectOption[]>([]);
  const [activoOptions, setActivoOptions] = useState<SelectOption[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Paciente SearchableSelect state
  const [pacSearch, setPacSearch] = useState("");
  const [pacSelectedId, setPacSelectedId] = useState<number | null>(null);
  const [pacShowDropdown, setPacShowDropdown] = useState(false);

  // Activo SearchableSelect state
  const [activoSearch, setActivoSearch] = useState("");
  const [activoSelectedId, setActivoSelectedId] = useState<number | null>(null);
  const [activoShowDropdown, setActivoShowDropdown] = useState(false);

  const [habitacion, setHabitacion] = useState("");
  const [numeroCama, setNumeroCama] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const [resPacientes, resTiposActivos] = await Promise.all([
        axiosInstance.get<PaginatedPacientes>(API_ENDPOINTS.pacientes.list, {
          params: { pagina: 1, tamanio: 100 },
        }),
        getTiposActivos(1, 200),
      ]);

      const tipoMonitor = resTiposActivos.datos.find(
        (tipo) => normalizeText(tipo.nombre) === "monitor",
      );

      if (!tipoMonitor) {
        setActivoOptions([]);
        const msg = "No existe un tipo de activo 'Monitor' configurado.";
        setFetchError(msg);
        toast.error(msg);
      } else {
        const resActivos = await getActivos(1, 200, { tipoId: tipoMonitor.id });
        setActivoOptions(
          resActivos.datos
            .filter((a: Activo) => a.tipoActivoId === tipoMonitor.id)
            .map((a: Activo) => ({
              id: a.id,
              label: `${a.tipoActivoNombre} — ${a.marca} ${a.modelo}`,
              sublabel: `Serie: ${a.numeroSerie}`,
            })),
        );
      }

      setPacOptions(
        resPacientes.data.datos.map((p: Paciente) => ({
          id: p.id,
          label: `${p.nombre} ${p.apellidos}`,
          sublabel: p.cedula,
        })),
      );
    } catch {
      const msg = "Error al cargar datos. Intente de nuevo.";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const filteredPacientes = pacOptions.filter(
    (p) =>
      p.label.toLowerCase().includes(pacSearch.toLowerCase()) ||
      (p.sublabel?.toLowerCase().includes(pacSearch.toLowerCase()) ?? false)
  );

  const filteredActivos = activoOptions.filter(
    (a) =>
      a.label.toLowerCase().includes(activoSearch.toLowerCase()) ||
      (a.sublabel?.toLowerCase().includes(activoSearch.toLowerCase()) ?? false)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!pacSelectedId) newErrors.paciente = "Seleccione un paciente.";
    if (!activoSelectedId) newErrors.activo = "Seleccione un monitor.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setEnviando(true);
    setApiError(null);
    try {
      const resultado = await crearMonitorPaciente({
        pacienteId: pacSelectedId!,
        activoId: activoSelectedId!,
        habitacion: habitacion || undefined,
        numeroCama: numeroCama || undefined,
      } as CrearMonitorPacienteDto);
      onVinculado(resultado);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensaje?: string } } })?.response?.data
          ?.mensaje ?? "Error al vincular el monitor.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {apiError && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{apiError}</span>
        </div>
      )}

     
      <SearchableSelect
        id="vincular-paciente"
        label="Paciente"
        required
        options={filteredPacientes}
        loading={fetchLoading}
        loadingText="Cargando pacientes..."
        selectedId={pacSelectedId}
        searchValue={pacSearch}
        onSearchChange={(e) => {
          setPacSearch(e.target.value);
          setPacSelectedId(null);
          setErrors((p) => ({ ...p, paciente: "" }));
        }}
        onSelect={(opt) => {
          setPacSelectedId(opt.id);
          setPacSearch(opt.label);
          setPacShowDropdown(false);
          setErrors((p) => ({ ...p, paciente: "" }));
        }}
        showDropdown={pacShowDropdown}
        onFocus={() => setPacShowDropdown(true)}
        onBlur={() => setPacShowDropdown(false)}
        placeholder="Buscar por nombre o cédula..."
        error={errors.paciente}
        fetchError={fetchError ?? undefined}
        onRetry={cargarDatos}
        onClear={() => {
          setPacSelectedId(null);
          setPacSearch("");
        }}
      />


      <SearchableSelect
        id="vincular-activo"
        label="Monitor"
        required
        options={filteredActivos}
        loading={fetchLoading}
        loadingText="Cargando activos..."
        selectedId={activoSelectedId}
        searchValue={activoSearch}
        onSearchChange={(e) => {
          setActivoSearch(e.target.value);
          setActivoSelectedId(null);
          setErrors((p) => ({ ...p, activo: "" }));
        }}
        onSelect={(opt) => {
          setActivoSelectedId(opt.id);
          setActivoSearch(opt.label);
          setActivoShowDropdown(false);
          setErrors((p) => ({ ...p, activo: "" }));
        }}
        showDropdown={activoShowDropdown}
        onFocus={() => setActivoShowDropdown(true)}
        onBlur={() => setActivoShowDropdown(false)}
        placeholder="Buscar por tipo, marca o número de serie..."
        error={errors.activo}
        onClear={() => {
          setActivoSelectedId(null);
          setActivoSearch("");
        }}
      />

 
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control w-full">
          <label className="label pb-1" htmlFor="vincular-habitacion">
            <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
              Habitación
            </span>
          </label>
          <input
            id="vincular-habitacion"
            type="text"
            className="input input-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none"
            placeholder="Ej: 101"
            value={habitacion}
            onChange={(e) => setHabitacion(e.target.value)}
          />
        </div>
        <div className="form-control w-full">
          <label className="label pb-1" htmlFor="vincular-cama">
            <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
              Número de cama
            </span>
          </label>
          <input
            id="vincular-cama"
            type="text"
            className="input input-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none"
            placeholder="Ej: A"
            value={numeroCama}
            onChange={(e) => setNumeroCama(e.target.value)}
          />
        </div>
      </div>

      <div className="modal-action mt-1">
        <button
          type="button"
          className="btn text-white"
          style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          disabled={enviando || fetchLoading}
        >
          {enviando && <span className="loading loading-spinner loading-sm" />}
          {enviando ? "Vinculando..." : "Vincular"}
        </button>
      </div>
    </form>
  );
}

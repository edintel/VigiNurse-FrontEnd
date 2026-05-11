"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { createBaby } from "@/features/baby-monitoring/services/babyService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { getPatients } from "@/features/patients/services/patientService";
import { Sexo, TIPOS_SANGRE } from "@/features/patients/types";
import type { Area } from "@/features/administration/areas/types";
import type { Paciente } from "@/features/patients/types";
import type { Bebe, CreateBebeDTO } from "@/features/baby-monitoring/types";
import { toast } from "@/lib/toast";

interface CreateBabyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (bebe: Bebe) => void;
}

const selectCls =
  "select select-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";

// Componente modal para registrar un nuevo bebé. Incluye validación, búsqueda de madre y selección de área.
export function CreateBabyModal({ open, onClose, onCreated }: CreateBabyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const madreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── form state ──────────────────────────────────────────────────────────────
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [horaNacimiento, setHoraNacimiento] = useState("");
  const [sexo, setSexo] = useState<Sexo>(Sexo.Masculino);
  const [tipoSangre, setTipoSangre] = useState("");
  const [peso, setPeso] = useState("");
  const [tamano, setTamano] = useState("");
  const [apgar, setApgar] = useState("");
  const [semanas, setSemanas] = useState("");
  const [areaId, setAreaId] = useState<string>("");

  // ── madre selector ──────────────────────────────────────────────────────────
  const [madreQuery, setMadreQuery] = useState("");
  const [madreResults, setMadreResults] = useState<Paciente[]>([]);
  const [selectedMadre, setSelectedMadre] = useState<Paciente | null>(null);
  const [madreLoading, setMadreLoading] = useState(false);
  const [showMadreDrop, setShowMadreDrop] = useState(false);

  // ── areas ───────────────────────────────────────────────────────────────────
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);

  // ── validation / submit ─────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      void loadAreas();
    } else {
      dialogRef.current?.close();
      resetAll();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (madreTimerRef.current) clearTimeout(madreTimerRef.current);
    };
  }, []);

  async function loadAreas() {
    setAreasLoading(true);
    try {
      const result = await getAreas(1, 100);
      setAreas(result.datos);
    } catch {
      // áreas no cargaron; el select quedará vacío
    } finally {
      setAreasLoading(false);
    }
  }

  function resetAll() {
    setNombre("");
    setApellidos("");
    setFechaNacimiento("");
    setHoraNacimiento("");
    setSexo(Sexo.Masculino);
    setTipoSangre("");
    setPeso("");
    setTamano("");
    setApgar("");
    setSemanas("");
    setAreaId("");
    setMadreQuery("");
    setMadreResults([]);
    setSelectedMadre(null);
    setShowMadreDrop(false);
    setErrors({});
  }

  // ── madre search (debounced 300 ms) ─────────────────────────────────────────
  function handleMadreQueryChange(value: string) {
    setMadreQuery(value);
    setSelectedMadre(null);
    if (madreTimerRef.current) clearTimeout(madreTimerRef.current);
    if (!value.trim()) {
      setMadreResults([]);
      setShowMadreDrop(false);
      return;
    }
    madreTimerRef.current = setTimeout(() => {
      void searchMadre(value.trim());
    }, 300);
  }

  async function searchMadre(query: string) {
    setMadreLoading(true);
    try {
      const result = await getPatients(1, 10, { nombre: query });
      setMadreResults(result.datos);
      setShowMadreDrop(true);
    } catch {
      setMadreResults([]);
    } finally {
      setMadreLoading(false);
    }
  }

  function handleSelectMadre(paciente: Paciente) {
    setSelectedMadre(paciente);
    setMadreQuery(`${paciente.apellidos}, ${paciente.nombre}`);
    setShowMadreDrop(false);
  }

  function handleClearMadre() {
    setSelectedMadre(null);
    setMadreQuery("");
    setMadreResults([]);
    setShowMadreDrop(false);
  }

  // ── submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (!apellidos.trim()) errs.apellidos = "Los apellidos son obligatorios.";
    if (!fechaNacimiento) errs.fechaNacimiento = "La fecha de nacimiento es obligatoria.";
    if (!horaNacimiento) errs.horaNacimiento = "La hora de nacimiento es obligatoria.";

    const pesoNum = parseFloat(peso);
    if (!peso || isNaN(pesoNum) || pesoNum <= 0)
      errs.peso = "Ingrese un peso válido en gramos.";

    const tamanoNum = parseFloat(tamano);
    if (!tamano || isNaN(tamanoNum) || tamanoNum <= 0)
      errs.tamano = "Ingrese una longitud válida en cm.";

    const apgarNum = parseFloat(apgar);
    if (apgar === "" || isNaN(apgarNum) || apgarNum < 0 || apgarNum > 10)
      errs.apgar = "El APGAR debe estar entre 0 y 10.";

    const semanasNum = parseInt(semanas);
    if (!semanas || isNaN(semanasNum) || semanasNum < 20 || semanasNum > 45)
      errs.semanas = "Ingrese semanas válidas (20–45).";

    if (!areaId) errs.areaId = "El área es obligatoria.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const dto: CreateBebeDTO = {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        fechaNacimiento: new Date(`${fechaNacimiento}T${horaNacimiento}`).toISOString(),
        sexo,
        tipoSangre: tipoSangre || null,
        madreId: selectedMadre?.id ?? null,
        peso: pesoNum,
        tamano: tamanoNum,
        puntuacionApgar: apgarNum,
        semanasGestacion: semanasNum,
        areaId: parseInt(areaId),
      };
      const bebe = await createBaby(dto);
      toast.success(`Bebé "${bebe.nombre} ${bebe.apellidos}" registrado exitosamente.`);
      onCreated(bebe);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })
        ?.response?.data;
      const msg =
        data?.mensaje ?? data?.message ?? "No se pudo registrar el bebé. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function err(field: string) {
    return errors[field];
  }

  function clearErr(field: string) {
    setErrors((p) => ({ ...p, [field]: "" }));
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">Registrar nuevo bebé</h3>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
          {/* Nombre · Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Nombre"
              id="bebe-nombre"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); clearErr("nombre"); }}
              placeholder="Ej. Sofía"
              error={err("nombre")}
              required
            />
            <InputField
              label="Apellidos"
              id="bebe-apellidos"
              value={apellidos}
              onChange={(e) => { setApellidos(e.target.value); clearErr("apellidos"); }}
              placeholder="Ej. Martínez López"
              error={err("apellidos")}
              required
            />
          </div>

          {/* Fecha de nacimiento · Hora de nacimiento */}
          <div className="grid grid-cols-2 gap-4">
            <CallyDatePicker
              id="bebe-fecha"
              label="Fecha de nacimiento"
              value={fechaNacimiento}
              onChange={(v) => { setFechaNacimiento(v); clearErr("fechaNacimiento"); }}
              placeholder="DD/MM/AAAA"
              error={err("fechaNacimiento")}
              required
              max={new Date().toISOString().split("T")[0]}
              variant="modal"
            />
            <div className="form-control w-full">
              <label className="label pb-1" htmlFor="bebe-hora">
                <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                  Hora de nacimiento <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                id="bebe-hora"
                type="time"
                className={`input input-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none ${err("horaNacimiento") ? "input-error" : ""}`}
                value={horaNacimiento}
                onChange={(e) => { setHoraNacimiento(e.target.value); clearErr("horaNacimiento"); }}
                required
              />
              {err("horaNacimiento") && (
                <label className="label pt-1">
                  <span className="label-text-alt text-error">{err("horaNacimiento")}</span>
                </label>
              )}
            </div>
          </div>

          {/* Sexo · Tipo de sangre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label pb-1" htmlFor="bebe-sexo">
                <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                  Sexo <span className="text-red-500">*</span>
                </span>
              </label>
              <select
                id="bebe-sexo"
                className={selectCls}
                value={sexo}
                onChange={(e) => setSexo(Number(e.target.value) as Sexo)}
              >
                <option value={Sexo.Masculino}>Masculino</option>
                <option value={Sexo.Femenino}>Femenino</option>
              </select>
            </div>
            <div className="form-control w-full">
              <label className="label pb-1" htmlFor="bebe-sangre">
                <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                  Tipo de sangre{" "}
                  <span className="text-slate-400 font-normal text-xs">(opcional)</span>
                </span>
              </label>
              <select
                id="bebe-sangre"
                className={selectCls}
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
              >
                <option value="">Sin registrar</option>
                {TIPOS_SANGRE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Peso · Longitud */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Peso al nacer (g)"
              id="bebe-peso"
              type="number"
              min="1"
              step="1"
              value={peso}
              onChange={(e) => { setPeso(e.target.value); clearErr("peso"); }}
              placeholder="Ej. 3200"
              error={err("peso")}
              required
            />
            <InputField
              label="Longitud al nacer (cm)"
              id="bebe-tamano"
              type="number"
              min="1"
              step="0.1"
              value={tamano}
              onChange={(e) => { setTamano(e.target.value); clearErr("tamano"); }}
              placeholder="Ej. 50"
              error={err("tamano")}
              required
            />
          </div>

          {/* APGAR · Semanas de gestación */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Puntuación APGAR (0–10)"
              id="bebe-apgar"
              type="number"
              min="0"
              max="10"
              step="1"
              value={apgar}
              onChange={(e) => { setApgar(e.target.value); clearErr("apgar"); }}
              placeholder="Ej. 8"
              error={err("apgar")}
              required
            />
            <InputField
              label="Semanas de gestación"
              id="bebe-semanas"
              type="number"
              min="20"
              max="45"
              step="1"
              value={semanas}
              onChange={(e) => { setSemanas(e.target.value); clearErr("semanas"); }}
              placeholder="Ej. 38"
              error={err("semanas")}
              required
            />
          </div>

          {/* Área */}
          <div className="form-control w-full">
            <label className="label pb-1" htmlFor="bebe-area">
              <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                Área <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              id="bebe-area"
              className={`${selectCls} ${err("areaId") ? "select-error" : ""}`}
              value={areaId}
              onChange={(e) => { setAreaId(e.target.value); clearErr("areaId"); }}
              disabled={areasLoading}
            >
              <option value="" disabled>
                {areasLoading ? "Cargando áreas..." : "Seleccionar área..."}
              </option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre} — {area.hospitalNombre}
                </option>
              ))}
            </select>
            {err("areaId") && (
              <label className="label pt-1">
                <span className="label-text-alt text-error">{err("areaId")}</span>
              </label>
            )}
          </div>

          {/* Madre (opcional) */}
          <div className="form-control w-full">
            <label className="label pb-1" htmlFor="bebe-madre">
              <span className="label-text text-sm font-medium" style={{ color: "#1A2B5E" }}>
                Madre{" "}
                <span className="text-slate-400 font-normal text-xs">(opcional)</span>
              </span>
            </label>
            <div className="relative">
              <input
                id="bebe-madre"
                type="text"
                className="input input-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none pr-8"
                placeholder="Buscar por nombre..."
                value={madreQuery}
                onChange={(e) => handleMadreQueryChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowMadreDrop(false), 150)}
                autoComplete="off"
                disabled={!!selectedMadre}
              />

              {/* Spinner mientras busca */}
              {madreLoading && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <span className="loading loading-spinner loading-xs text-[#09268E]" />
                </span>
              )}

              {/* Botón limpiar */}
              {(selectedMadre || madreQuery) && !madreLoading && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Limpiar selección de madre"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={handleClearMadre}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}

              {/* Dropdown resultados */}
              {showMadreDrop && !madreLoading && madreResults.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {madreResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm text-[#1A2B5E] hover:bg-slate-50 transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectMadre(p)}
                      >
                        <span className="font-semibold">
                          {p.apellidos}, {p.nombre}
                        </span>
                        <span className="text-slate-400 ml-2 text-xs">{p.cedula}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Sin resultados */}
              {showMadreDrop && !madreLoading && madreResults.length === 0 && madreQuery.trim() && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg px-3 py-2 text-sm text-slate-400">
                  No se encontraron pacientes.
                </div>
              )}
            </div>

            {selectedMadre && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                Madre seleccionada: {selectedMadre.apellidos}, {selectedMadre.nombre} (ID {selectedMadre.id})
              </p>
            )}
          </div>

          {/* Acciones */}
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
              {loading ? "Registrando..." : "Registrar bebé"}
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

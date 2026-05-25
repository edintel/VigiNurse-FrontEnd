"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { createAsignacionCiclo, renovarAsignacion } from "../../services/turnosService";
import type {
  AsignacionCiclo,
  GrupoPersonal,
  CicloRotacion,
  PlantillaTurno,
  CreateAsignacionCicloDto,
  RenovarAsignacionDto,
} from "../../types";

interface Props {
  open: boolean;
  mode: "crear" | "renovar";
  asignacion: AsignacionCiclo | null;
  grupos: GrupoPersonal[];
  ciclos: CicloRotacion[];
  plantillas: PlantillaTurno[];
  onClose: () => void;
  onSaved: (a: AsignacionCiclo) => void;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

function parseDias(diasStr: string): number[] {
  return diasStr
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 7);
}

interface SemanaPrev {
  semana: number;
  plantillaNombre: string;
  diasCount: number;
}

interface LocalPreview {
  totalTurnos: number;
  semanas: SemanaPrev[];
}

function calcLocalPreview(
  ciclo: CicloRotacion,
  grupo: GrupoPersonal,
  semanaInicio: number,
  plantillas: PlantillaTurno[],
): LocalPreview {
  const plantillaMap = Object.fromEntries(plantillas.map((p) => [p.id, p]));
  let totalDiasTurno = 0;
  const semanas: SemanaPrev[] = [];

  for (let semNum = 1; semNum <= ciclo.duracionSemanas; semNum++) {
    const cicloWeek = ((semanaInicio - 1 + semNum - 1) % ciclo.cantidadTurnos) + 1;
    const turno = (ciclo.turnos ?? []).find((t) => t.orden === cicloWeek);
    const dias = turno ? parseDias(turno.diasSemana) : [];
    totalDiasTurno += dias.length;
    semanas.push({
      semana: semNum,
      plantillaNombre: turno ? (plantillaMap[turno.plantillaId]?.nombre ?? `Turno ${turno.orden}`) : `Turno ${cicloWeek}`,
      diasCount: dias.length,
    });
  }

  return {
    totalTurnos: totalDiasTurno * (grupo.cantidadMiembros || 1),
    semanas,
  };
}

// Modal para crear una nueva asignación por ciclo o renovar una existente. 
// En modo renovación solo se pueden cambiar fecha inicio y semana inicio, el grupo y ciclo quedan fijos.
export function AsignacionCicloModal({
  open,
  mode,
  asignacion,
  grupos,
  ciclos,
  plantillas,
  onClose,
  onSaved,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [grupoId, setGrupoId] = useState(0);
  const [cicloId, setCicloId] = useState(0);
  const [fechaInicio, setFechaInicio] = useState("");
  const [semanaInicio, setSemanaInicio] = useState(1);
  const [saving, setSaving] = useState(false);

  // Grupo SearchableSelect
  const [grupoSearch, setGrupoSearch] = useState("");
  const [grupoShowDropdown, setGrupoShowDropdown] = useState(false);

  // Ciclo SearchableSelect
  const [cicloSearch, setCicloSearch] = useState("");
  const [cicloShowDropdown, setCicloShowDropdown] = useState(false);

  const grupoOptions = useMemo(
    () =>
      grupos
        .filter((g) =>
          g.nombre.toLowerCase().includes(grupoSearch.toLowerCase())
        )
        .map((g) => ({
          id: g.id,
          label: g.nombre,
          sublabel: `${g.cantidadMiembros} miembro${g.cantidadMiembros !== 1 ? "s" : ""}`,
        })),
    [grupos, grupoSearch]
  );

  const cicloOptions = useMemo(
    () =>
      ciclos
        .filter((c) =>
          c.nombre.toLowerCase().includes(cicloSearch.toLowerCase())
        )
        .map((c) => ({
          id: c.id,
          label: c.nombre,
          sublabel: `${c.duracionSemanas} sem · ${c.cantidadTurnos} turno${c.cantidadTurnos !== 1 ? "s" : ""}`,
        })),
    [ciclos, cicloSearch]
  );

  const grupo = grupos.find((g) => g.id === grupoId) ?? null;
  const ciclo = ciclos.find((c) => c.id === cicloId) ?? null;

  const localPreview = useMemo<LocalPreview | null>(() => {
    if (!ciclo || !grupo) return null;
    return calcLocalPreview(ciclo, grupo, semanaInicio, plantillas);
  }, [ciclo, grupo, semanaInicio, plantillas]);

  useEffect(() => {
    if (open) {
      if (mode === "renovar" && asignacion) {
        setGrupoId(asignacion.grupoId);
        setCicloId(asignacion.cicloId);
        setSemanaInicio(asignacion.semanaInicio ?? 1);
        setFechaInicio("");
      } else {
        setGrupoId(0);
        setGrupoSearch("");
        setCicloId(0);
        setCicloSearch("");
        setFechaInicio("");
        setSemanaInicio(1);
      }
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, mode, asignacion]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fechaInicio) { toast.error("La fecha de inicio es requerida."); return; }
    if (mode === "crear" && !grupoId) { toast.error("Selecciona un grupo."); return; }
    if (mode === "crear" && !cicloId) { toast.error("Selecciona un ciclo."); return; }
    setSaving(true);
    try {
      let saved: AsignacionCiclo;
      if (mode === "renovar" && asignacion) {
        const dto: RenovarAsignacionDto = { fechaInicio, semanaInicio };
        saved = await renovarAsignacion(asignacion.id, dto);
      } else {
        const dto: CreateAsignacionCicloDto = { grupoId, cicloId, fechaInicio, semanaInicio };
        saved = await createAsignacionCiclo(dto);
      }
      toast.success(mode === "renovar" ? "Asignación renovada." : "Asignación creada. Turnos generados.");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "Error al guardar la asignación."));
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "block text-sm font-semibold text-[#1A2B5E] mb-1.5";
  const inputCls =
    "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">
              {mode === "renovar" ? "Renovar asignación" : "Nueva asignación por ciclo"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "renovar"
                ? "Se generarán turnos para el siguiente período."
                : "Asigna un ciclo de rotación a un grupo."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost btn-circle text-slate-400"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-7 py-5 flex-1 overflow-y-auto space-y-4">
            {/* Grupo */}
            <div>
              <label className={labelCls}>Grupo de personal</label>
              {mode === "renovar" && asignacion ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: asignacion.colorGrupo }} />
                  <span className="text-sm font-medium text-[#0f172a]">{asignacion.nombreGrupo}</span>
                </div>
              ) : (
                <SearchableSelect
                  id="asig-grupo"
                  label=""
                  variant="filter"
                  options={grupoOptions}
                  selectedId={grupoId || null}
                  searchValue={grupoSearch}
                  onSearchChange={(e) => {
                    setGrupoSearch(e.target.value);
                    if (grupoId) { setGrupoId(0); }
                  }}
                  onSelect={(opt) => {
                    setGrupoId(opt.id);
                    setGrupoSearch(opt.label);
                    setGrupoShowDropdown(false);
                  }}
                  showDropdown={grupoShowDropdown}
                  onFocus={() => setGrupoShowDropdown(true)}
                  onBlur={() => setGrupoShowDropdown(false)}
                  onClear={() => { setGrupoId(0); setGrupoSearch(""); }}
                  placeholder="Buscar grupo..."
                  emptyText="No se encontraron grupos."
                  inputClassName="py-2.5 text-sm rounded-lg focus:ring-2 focus:ring-[#09268E]/30"
                />
              )}
            </div>

            {/* Ciclo */}
            <div>
              <label className={labelCls}>Ciclo de rotación</label>
              {mode === "renovar" && asignacion ? (
                <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                  <span className="text-sm font-medium text-[#0f172a]">{asignacion.nombreCiclo}</span>
                </div>
              ) : (
                <SearchableSelect
                  id="asig-ciclo"
                  label=""
                  variant="filter"
                  options={cicloOptions}
                  selectedId={cicloId || null}
                  searchValue={cicloSearch}
                  onSearchChange={(e) => {
                    setCicloSearch(e.target.value);
                    if (cicloId) { setCicloId(0); }
                  }}
                  onSelect={(opt) => {
                    setCicloId(opt.id);
                    setCicloSearch(opt.label);
                    setCicloShowDropdown(false);
                  }}
                  showDropdown={cicloShowDropdown}
                  onFocus={() => setCicloShowDropdown(true)}
                  onBlur={() => setCicloShowDropdown(false)}
                  onClear={() => { setCicloId(0); setCicloSearch(""); }}
                  placeholder="Buscar ciclo..."
                  emptyText="No se encontraron ciclos."
                  inputClassName="py-2.5 text-sm rounded-lg focus:ring-2 focus:ring-[#09268E]/30"
                />
              )}
            </div>

            {/* Fecha inicio + semana inicio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <CallyDatePicker
                  id="asig-fecha-inicio"
                  label="Fecha inicio"
                  value={fechaInicio}
                  onChange={setFechaInicio}
                  placeholder="Seleccionar fecha"
                  variant="modal"
                  inputClassName="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition"
                  labelClassName="font-semibold"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Semana de inicio
                  {ciclo && (
                    <span className="text-slate-400 font-normal text-xs"> (1–{ciclo.duracionSemanas})</span>
                  )}
                </label>
                <input
                  type="number"
                  min={1}
                  max={ciclo?.duracionSemanas ?? 52}
                  className={inputCls + " h-12"}
                  value={semanaInicio}
                  onChange={(e) =>
                    setSemanaInicio(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
            </div>

            {/* Preview local */}
            {localPreview && (
              <div className="rounded-xl border border-[#09268E]/20 bg-[#09268E]/3 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Vista previa del patrón
                  </p>
                  <span className="text-sm font-bold text-[#09268E]">
                    ~{localPreview.totalTurnos} turno{localPreview.totalTurnos !== 1 ? "s" : ""} a generar
                  </span>
                </div>

                {grupo && ciclo && (
                  <p className="text-xs text-slate-500">
                    {grupo.cantidadMiembros} miembro{grupo.cantidadMiembros !== 1 ? "s" : ""} ·{" "}
                    {ciclo.duracionSemanas} semanas ·{" "}
                    {ciclo.cantidadTurnos} turno{ciclo.cantidadTurnos !== 1 ? "s" : ""} rotativos
                  </p>
                )}

                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {localPreview.semanas.map((s) => (
                    <div key={s.semana} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 w-16 shrink-0 tabular-nums">
                        Semana {s.semana}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full px-2 py-0.5 bg-[#09268E]/10 text-[#09268E] font-semibold">
                          {s.plantillaNombre}
                        </span>
                        <span className="text-slate-400">
                          {s.diasCount} día{s.diasCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {(ciclo?.turnos ?? []).length === 0 && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                    </svg>
                    El ciclo no expone detalle de turnos en el listado. El total real lo calculará el backend.
                  </p>
                )}
              </div>
            )}

            {!localPreview && (cicloId > 0 || grupoId > 0) && (
              <p className="text-xs text-slate-400 text-center py-2">
                Selecciona grupo y ciclo para ver la vista previa.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-sm btn-ghost text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-sm text-white border-none"
              style={{ background: "#09268E" }}
            >
              {saving && <span className="loading loading-spinner loading-xs" />}
              {mode === "renovar" ? "Renovar" : "Generar turnos"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

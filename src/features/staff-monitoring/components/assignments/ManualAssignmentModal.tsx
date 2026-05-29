"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createManualShift, createShiftRange } from "../../services/shiftsService";
import { getMedicalStaff } from "../../services/medicalStaffService";
import type { TurnoPersonal, RangoTurnoResult, Area, PlantillaTurno } from "../../types";
import { TipoTurno } from "../../types";

interface Props {
  open: boolean;
  areas: Area[];
  templates: PlantillaTurno[];
  onClose: () => void;
  onCreated: (result: TurnoPersonal | RangoTurnoResult) => void;
}

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

function countWeekdays(desde: string, hasta: string, dias: number[]): number {
  if (!desde || !hasta || !dias.length) return 0;
  let count = 0;
  const start = new Date(desde);
  const end = new Date(hasta);
  const cur = new Date(start);
  while (cur <= end) {
    // getDay() returns 0=Sun, 1=Mon... we use 1=Mon (1-7 mapping)
    const dayOfWeek = cur.getDay() === 0 ? 7 : cur.getDay();
    if (dias.includes(dayOfWeek)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Modal para asignar turnos manualmente, ya sea uno puntual o en rango. 
// Permite buscar personal por nombre, elegir plantilla o configurar horas/área manualmente, 
// y muestra un preview de cuántos turnos se generarán en modo rango.
export function ManualAssignmentModal({ open, areas, templates, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"puntual" | "rango">("puntual");
  const [usarPlantilla, setUsarPlantilla] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal search
  const [personalSearch, setPersonalSearch] = useState("");
  const [personalResults, setPersonalResults] = useState<{ id: number; nombre: string; apellidos: string }[]>([]);
  const [personalSearching, setPersonalSearching] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<{ id: number; nombre: string; apellidos: string } | null>(null);
  const [showPersonalDrop, setShowPersonalDrop] = useState(false);

  const [plantillaId, setPlantillaId] = useState(0);
  const [areaId, setAreaId] = useState(0);
  const [horaInicio, setHoraInicio] = useState("07:00");
  const [horaFin, setHoraFin] = useState("15:00");
  const [tipoTurno, setTipoTurno] = useState<TipoTurno>(TipoTurno.Regular);

  // Puntual
  const [fecha, setFecha] = useState("");

  // Rango
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);

  const turnosPreview = mode === "rango" ? countWeekdays(fechaDesde, fechaHasta, diasSemana) : 0;

  useEffect(() => {
    if (open) {
      setMode("puntual");
      setUsarPlantilla(true);
      setSelectedPersonal(null);
      setPersonalSearch("");
      setPlantillaId(0);
      setAreaId(0);
      setFecha("");
      setFechaDesde("");
      setFechaHasta("");
      setDiasSemana([1, 2, 3, 4, 5]);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    if (!personalSearch.trim() || selectedPersonal) return;
    const t = setTimeout(async () => {
      setPersonalSearching(true);
      try {
        const result = await getMedicalStaff(1, 10, { nombre: personalSearch });
        setPersonalResults(result.datos.map((p) => ({ id: p.id, nombre: p.nombre, apellidos: p.apellidos })));
      } catch {
        setPersonalResults([]);
      } finally {
        setPersonalSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [personalSearch, selectedPersonal]);

  function toggleDia(dayNum: number) {
    setDiasSemana((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort((a, b) => a - b)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPersonal) { toast.error("Selecciona un profesional."); return; }

    if (mode === "puntual") {
      if (!fecha) { toast.error("Selecciona la fecha del turno."); return; }
      const plantilla = templates.find((p) => p.id === plantillaId);
      const aIdFinal = usarPlantilla && plantilla ? plantilla.areaId : areaId;
      if (!aIdFinal) { toast.error("Selecciona un área."); return; }

      setSaving(true);
      try {
        let fechaInicioISO: string;
        let fechaFinISO: string;
        if (usarPlantilla && plantilla) {
          fechaInicioISO = `${fecha}T${plantilla.horaInicio}Z`;
          const finDate = plantilla.cruzaMedianoche
            ? new Date(new Date(fecha).getTime() + 86400000).toISOString().slice(0, 10)
            : fecha;
          fechaFinISO = `${finDate}T${plantilla.horaFin}Z`;
        } else {
          fechaInicioISO = `${fecha}T${horaInicio}:00Z`;
          fechaFinISO = `${fecha}T${horaFin}:00Z`;
        }
        const result = await createManualShift({
          usuarioId: selectedPersonal.id,
          areaId: aIdFinal,
          fechaInicio: fechaInicioISO,
          fechaFin: fechaFinISO,
          tipoTurno,
          plantillaId: usarPlantilla && plantillaId ? plantillaId : undefined,
        });
        toast.success("Turno asignado.");
        onCreated(result);
        onClose();
      } catch (err) {
        toast.error(extractApiError(err, "Error al asignar el turno."));
      } finally {
        setSaving(false);
      }
    } else {
      if (!fechaDesde || !fechaHasta) { toast.error("Selecciona el rango de fechas."); return; }
      if (!diasSemana.length) { toast.error("Selecciona al menos un día."); return; }
      if (!areaId && !usarPlantilla) { toast.error("Selecciona un área."); return; }
      if (usarPlantilla && !plantillaId) { toast.error("Selecciona una plantilla."); return; }

      setSaving(true);
      try {
        const plantilla = templates.find((p) => p.id === plantillaId);
        const aIdFinal = usarPlantilla && plantilla ? plantilla.areaId : areaId;
        const result = await createShiftRange({
          usuarioId: selectedPersonal.id,
          areaId: aIdFinal,
          fechaDesde,
          fechaHasta,
          diasSemana,
          tipoTurno,
          plantillaId: usarPlantilla && plantillaId ? plantillaId : undefined,
          horaInicio: !usarPlantilla ? horaInicio : undefined,
          horaFin: !usarPlantilla ? horaFin : undefined,
        });
        toast.success(`${result.turnosCreados} turno${result.turnosCreados !== 1 ? "s" : ""} generado${result.turnosCreados !== 1 ? "s" : ""}.`);
        onCreated(result);
        onClose();
      } catch (err) {
        toast.error(extractApiError(err, "Error al generar los turnos."));
      } finally {
        setSaving(false);
      }
    }
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Asignación manual de turno</h3>
            <p className="text-xs text-slate-500 mt-0.5">Asigna turnos individuales o en rango.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-7 py-5 flex-1 overflow-y-auto space-y-4">
            {/* Mode selector */}
            <div className="flex gap-3">
              {([["puntual", "Turno puntual"], ["rango", "Rango de fechas"]] as const).map(([v, l]) => (
                <label key={v} className={`flex items-center gap-2 flex-1 rounded-lg border px-3 py-2.5 cursor-pointer transition ${mode === v ? "border-[#09268E] bg-[#09268E]/5 text-[#09268E]" : "border-[#e2e8f0] text-slate-500"}`}>
                  <input type="radio" name="mode" className="radio radio-xs" style={{ accentColor: "#09268E" }} checked={mode === v} onChange={() => setMode(v)} />
                  <span className="text-sm font-medium">{l}</span>
                </label>
              ))}
            </div>

            {/* Personal search */}
            <div className="relative">
              <label className={labelCls}>Profesional</label>
              {selectedPersonal ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                  <span className="flex-1 text-sm font-medium text-[#0f172a]">{selectedPersonal.nombre} {selectedPersonal.apellidos}</span>
                  <button type="button" onClick={() => { setSelectedPersonal(null); setPersonalSearch(""); }} className="text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    className={inputCls}
                    placeholder="Buscar por nombre..."
                    value={personalSearch}
                    onChange={(e) => { setPersonalSearch(e.target.value); setShowPersonalDrop(true); }}
                    onFocus={() => setShowPersonalDrop(true)}
                    onBlur={() => setTimeout(() => setShowPersonalDrop(false), 200)}
                  />
                  {showPersonalDrop && (personalSearching || personalResults.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {personalSearching
                        ? <div className="flex justify-center py-3"><span className="loading loading-spinner loading-sm text-[#09268E]" /></div>
                        : personalResults.map((p) => (
                          <button key={p.id} type="button"
                            className="w-full text-left px-3 py-2 hover:bg-[#f8fafc] text-sm transition-colors"
                            onMouseDown={() => { setSelectedPersonal(p); setPersonalSearch(p.nombre + " " + p.apellidos); setShowPersonalDrop(false); }}
                          >{p.nombre} {p.apellidos}</button>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tipo turno */}
            <div>
              <label className={labelCls}>Tipo de turno</label>
              <div className="flex gap-2">
                {[
                  { value: TipoTurno.Regular, label: "Regular" },
                  { value: TipoTurno.Guardia, label: "Guardia" },
                ].map(({ value, label }) => (
                  <label key={value} className={`flex items-center gap-1.5 flex-1 rounded-lg border px-3 py-2 cursor-pointer transition text-sm ${tipoTurno === value ? "border-[#09268E] bg-[#09268E]/5 text-[#09268E]" : "border-[#e2e8f0] text-slate-500"}`}>
                    <input type="radio" className="radio radio-xs" style={{ accentColor: "#09268E" }} checked={tipoTurno === value} onChange={() => setTipoTurno(value)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Toggle plantilla */}
            <div className="flex items-center justify-between rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2.5">
              <span className="text-sm font-medium text-[#0f172a]">Usar plantilla</span>
              <input type="checkbox" className="toggle toggle-sm" style={{ accentColor: "#09268E" }} checked={usarPlantilla} onChange={(e) => setUsarPlantilla(e.target.checked)} />
            </div>

            {usarPlantilla ? (
              <div>
                <label className={labelCls}>Plantilla</label>
                <select className={inputCls + " cursor-pointer"} value={plantillaId || ""} onChange={(e) => setPlantillaId(Number(e.target.value))}>
                  <option value="">Seleccionar plantilla...</option>
                  {templates.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.horaInicio.slice(0, 5)}–{p.horaFin.slice(0, 5)}) · {p.nombreArea}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Hora inicio</label>
                    <input type="time" className={inputCls} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Hora fin</label>
                    <input type="time" className={inputCls} value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Área</label>
                  <select className={inputCls + " cursor-pointer"} value={areaId || ""} onChange={(e) => setAreaId(Number(e.target.value))}>
                    <option value="">Seleccionar área...</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Puntual: fecha */}
            {mode === "puntual" && (
              <div>
                <label className={labelCls}>Fecha del turno</label>
                <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            )}

            {/* Rango: fechas + días */}
            {mode === "rango" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Fecha desde</label>
                    <input type="date" className={inputCls} value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Fecha hasta</label>
                    <input type="date" className={inputCls} value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Días de la semana</label>
                  <div className="flex gap-1.5">
                    {DAYS.map((d, i) => (
                      <button key={d} type="button"
                        onClick={() => toggleDia(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${diasSemana.includes(i + 1) ? "bg-[#09268E] text-white border-[#09268E]" : "bg-white text-slate-500 border-[#e2e8f0] hover:border-[#09268E]"}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                {turnosPreview > 0 && (
                  <div className="rounded-lg bg-[#09268E]/5 border border-[#09268E]/20 px-3 py-2 text-sm text-[#09268E] font-medium">
                    Se generarán <strong>{turnosPreview}</strong> turno{turnosPreview !== 1 ? "s" : ""}.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost text-slate-600">Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-sm text-white border-none" style={{ background: "#09268E" }}>
              {saving && <span className="loading loading-spinner loading-xs" />}
              {mode === "rango" ? "Generar turnos" : "Asignar turno"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}

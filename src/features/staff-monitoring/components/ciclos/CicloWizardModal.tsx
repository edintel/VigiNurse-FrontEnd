"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createCiclo, updateCiclo } from "../../services/ciclosService";
import type { CicloRotacion, CreateCicloDto, PlantillaTurno, TurnoCiclo } from "../../types";

interface Props {
  open: boolean;
  ciclo: CicloRotacion | null;
  plantillas: PlantillaTurno[];
  onClose: () => void;
  onSaved: (c: CicloRotacion) => void;
}

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

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
    .filter((n) => !isNaN(n));
}

function formatDias(dias: number[]): string {
  return dias.join(",");
}

// Modal con wizard de 2 pasos para crear o editar un ciclo de rotación. 
// En el paso 1 se configuran los datos generales del ciclo, 
// y en el paso 2 se asignan las plantillas a cada turno y los días de la semana. 
// Al guardar, se llama a la API correspondiente según si es creación o edición.
export function CicloWizardModal({ open, ciclo, plantillas, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 fields
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionSemanas, setDuracionSemanas] = useState(4);
  const [cantidadTurnos, setCantidadTurnos] = useState(3);

  // Step 2 fields
  const [turnosConf, setTurnosConf] = useState<TurnoCiclo[]>([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      if (ciclo) {
        setNombre(ciclo.nombre);
        setDescripcion(ciclo.descripcion ?? "");
        setDuracionSemanas(ciclo.duracionSemanas);
        setCantidadTurnos(ciclo.cantidadTurnos);
        setTurnosConf(ciclo.turnos ?? []);
      } else {
        setNombre("");
        setDescripcion("");
        setDuracionSemanas(4);
        setCantidadTurnos(3);
        setTurnosConf([]);
      }
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, ciclo]);

  function goToStep2() {
    if (!nombre.trim()) { toast.error("El nombre es requerido."); return; }
    if (duracionSemanas < 1) { toast.error("La duración debe ser al menos 1 semana."); return; }
    if (cantidadTurnos < 1) { toast.error("Debe haber al menos 1 turno."); return; }
    if (cantidadTurnos > duracionSemanas) { toast.error("Los turnos no pueden superar la duración."); return; }

    setTurnosConf((prev) => {
      const next: TurnoCiclo[] = [];
      for (let i = 1; i <= cantidadTurnos; i++) {
        const existing = prev.find((t) => t.orden === i);
        next.push(existing ?? { orden: i, plantillaId: 0, diasSemana: "1,2,3,4,5" });
      }
      return next;
    });
    setStep(2);
  }

  function toggleDia(orden: number, diaIdx: number) {
    const dayNum = diaIdx + 1;
    setTurnosConf((prev) =>
      prev.map((t) => {
        if (t.orden !== orden) return t;
        const dias = parseDias(t.diasSemana);
        const updated = dias.includes(dayNum)
          ? dias.filter((d) => d !== dayNum)
          : [...dias, dayNum].sort((a, b) => a - b);
        return { ...t, diasSemana: formatDias(updated) };
      }),
    );
  }

  async function handleSave() {
    for (const t of turnosConf) {
      if (!t.plantillaId) { toast.error(`Selecciona plantilla para turno ${t.orden}.`); return; }
      if (!parseDias(t.diasSemana).length) { toast.error(`Selecciona al menos un día para turno ${t.orden}.`); return; }
    }
    setSaving(true);
    try {
      let saved: CicloRotacion;
      if (ciclo) {
        saved = await updateCiclo(ciclo.id, {
          nombre,
          descripcion,
          activo: ciclo.activo,
          turnos: turnosConf.map((t) => ({ orden: t.orden, plantillaId: t.plantillaId })),
        });
      } else {
        const dto: CreateCicloDto = { nombre, duracionSemanas, cantidadTurnos, descripcion, turnos: turnosConf };
        saved = await createCiclo(dto);
      }
      toast.success(ciclo ? "Ciclo actualizado." : "Ciclo creado.");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "Error al guardar el ciclo."));
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">{ciclo ? "Editar ciclo" : "Nuevo ciclo de rotación"}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${step >= s ? "bg-[#09268E] text-white" : "bg-slate-200 text-slate-500"}`}>{s}</span>
                  {s < 2 && <div className={`h-px w-8 ${step > 1 ? "bg-[#09268E]" : "bg-slate-200"}`} />}
                </React.Fragment>
              ))}
              <span className="text-xs text-slate-400 ml-1">Paso {step} de 2</span>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nombre del ciclo</label>
                <input className={inputCls} placeholder="Ej. Ciclo UCI 4 semanas" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Descripción (opcional)</label>
                <textarea className={inputCls + " resize-none"} rows={2} placeholder="Descripción breve..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Duración (semanas)</label>
                  <input type="number" min={1} max={52} className={inputCls} value={duracionSemanas}
                    onChange={(e) => setDuracionSemanas(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={!!ciclo}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cantidad de turnos</label>
                  <input type="number" min={1} max={duracionSemanas} className={inputCls} value={cantidadTurnos}
                    onChange={(e) => setCantidadTurnos(Math.min(duracionSemanas, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={!!ciclo}
                  />
                </div>
              </div>
              {ciclo && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  La duración y cantidad de turnos no se pueden modificar. Puedes cambiar nombre, descripción y las plantillas asignadas.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {turnosConf.map((t) => {
                const dias = parseDias(t.diasSemana);
                const plantilla = plantillas.find((p) => p.id === t.plantillaId);
                return (
                  <div key={t.orden} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#09268E] text-white text-xs font-bold flex items-center justify-center shrink-0">{t.orden}</span>
                      <span className="text-sm font-semibold text-[#1A2B5E]">Turno {t.orden}</span>
                    </div>
                    <div>
                      <label className={labelCls}>Plantilla</label>
                      <select
                        className={inputCls + " cursor-pointer"}
                        value={t.plantillaId || ""}
                        onChange={(e) =>
                          setTurnosConf((prev) =>
                            prev.map((x) => x.orden === t.orden ? { ...x, plantillaId: Number(e.target.value) } : x)
                          )
                        }
                      >
                        <option value="">Seleccionar plantilla...</option>
                        {plantillas.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre} ({p.horaInicio.slice(0, 5)}–{p.horaFin.slice(0, 5)})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Días de la semana</label>
                      <div className="flex gap-1.5">
                        {DAYS.map((d, i) => (
                          <button
                            key={d}
                            type="button"
                            disabled={!!ciclo}
                            onClick={() => toggleDia(t.orden, i)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${
                              dias.includes(i + 1)
                                ? "bg-[#09268E] text-white border-[#09268E]"
                                : "bg-white text-slate-500 border-[#e2e8f0] hover:border-[#09268E] hover:text-[#09268E]"
                            }`}
                          >{d}</button>
                        ))}
                      </div>
                    </div>
                    {plantilla && (
                      <p className="text-xs text-slate-500">
                        Horario: <span className="font-mono bg-white rounded px-1">{plantilla.horaInicio.slice(0,5)}–{plantilla.horaFin.slice(0,5)}</span>
                        {plantilla.cruzaMedianoche && " · Cruza medianoche"}
                        · {plantilla.nombreArea}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Preview pattern */}
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vista previa del patrón</p>
                <div className="space-y-1">
                  {Array.from({ length: duracionSemanas }).map((_, wi) => {
                    const turno = turnosConf[wi % cantidadTurnos];
                    const plantilla = turno ? plantillas.find((p) => p.id === turno.plantillaId) : null;
                    return (
                      <div key={wi} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-16 shrink-0">Semana {wi + 1}</span>
                        <span className="text-xs rounded-full px-2 py-0.5 bg-[#09268E]/10 text-[#09268E] font-medium">
                          {plantilla ? plantilla.nombre : turno ? `Turno ${turno.orden}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between">
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost text-slate-600">Cancelar</button>
          <div className="flex gap-2">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} disabled={saving} className="btn btn-sm btn-outline border-[#e2e8f0] text-slate-600">
                Atrás
              </button>
            )}
            {step === 1 ? (
              <button type="button" onClick={goToStep2} className="btn btn-sm text-white border-none" style={{ background: "#09268E" }}>
                Siguiente →
              </button>
            ) : (
              <button type="button" onClick={() => void handleSave()} disabled={saving} className="btn btn-sm text-white border-none" style={{ background: "#09268E" }}>
                {saving && <span className="loading loading-spinner loading-xs" />}
                {ciclo ? "Guardar cambios" : "Guardar ciclo"}
              </button>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}

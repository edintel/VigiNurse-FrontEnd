"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useVitalSigns } from "@/features/vitals-monitoring/hooks/useVitalSigns";
import { unassignMonitor } from "@/features/vitals-monitoring/services/monitorService";
import { toast } from "@/lib/toast";
import type { MonitorPacienteDto } from "@/features/vitals-monitoring/types";

interface Props {
  monitor: MonitorPacienteDto;
  onDesasignado: (id: number) => void;
}

// Rangos normales para cada signo vital (pueden ajustarse según protocolos clínicos)
const RANGES: Record<string, [number, number]> = {
  frecuenciaCardiaca:    [60,  100],
  spO2:                  [95,  100],
  temperatura:           [36.0, 37.5],
  presionSistolica:      [90,  140],
  presionDiastolica:     [60,   90],
  frecuenciaRespiratoria:[12,   20],
};

// Determina el estado de un signo vital basado en su valor y los rangos definidos
function vitalStatus(key: string, value: number | null): "normal" | "high" | "low" {
  if (value === null) return "normal";
  const [min, max] = RANGES[key] ?? [0, Infinity];
  if (value > max) return "high";
  if (value < min) return "low";
  return "normal";
}

// Estados de conexión del monitor con su configuración visual asociada
const STATE_CONFIG = {
  connected:    { bar: "bg-emerald-400",   dot: "bg-emerald-400", pulse: true,  label: "En vivo" },
  connecting:   { bar: "bg-amber-400",     dot: "bg-amber-400",   pulse: false, label: "Conectando…" },
  disconnected: { bar: "bg-slate-300",     dot: "bg-slate-400",   pulse: false, label: "Desconectado" },
  error:        { bar: "bg-red-400",       dot: "bg-red-500",     pulse: false, label: "Error" },
} as const;

// Iconos SVG para cada signo vital
function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  );
}

function PressureUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v8M8 11l4-4 4 4"/>
    </svg>
  );
}

function PressureDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v8M8 13l4 4 4-4"/>
    </svg>
  );
}

function WindIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
    </svg>
  );
}

// Componente para mostrar cada signo vital con su valor, unidad, icono y estado visual
function VitalCell({
  label,
  value,
  unit,
  icon,
  statusKey,
  dimmed,
}: {
  label: string;
  value: number | string | null;
  unit: string;
  icon: React.ReactNode;
  statusKey: string;
  dimmed: boolean;
}) {
  const numericVal = typeof value === "string" ? parseFloat(value) : value;
  const status = vitalStatus(statusKey, numericVal);

  const valueCls =
    status !== "normal" ? "text-red-600" : "text-[#1A2B5E]";

  const bgCls =
    status !== "normal" ? "bg-red-50" : "bg-transparent";

  return (
    <div
      className={`flex flex-col items-center py-3 px-1 gap-0.5 transition-opacity ${bgCls} ${
        dimmed ? "opacity-40" : ""
      }`}
    >
      <span className={`mb-0.5 ${status !== "normal" ? "text-red-500" : "text-slate-400"}`}>
        {icon}
      </span>
      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      {value !== null ? (
        <span className={`text-[19px] font-bold tabular-nums leading-tight ${valueCls}`}>
          {value}
        </span>
      ) : (
        <span className="text-[19px] font-bold text-slate-200">—</span>
      )}
      <span className="text-[9px] text-slate-400">{unit}</span>
    </div>
  );
}

// Componente principal para mostrar la tarjeta de monitorización de un paciente con sus signos vitales y estado de conexión
export function MonitorCard({ monitor, onDesasignado }: Props) {
  const { lectura, estado } = useVitalSigns(monitor.pacienteId);
  const cfg = STATE_CONFIG[estado];
  const isDimmed = estado === "disconnected" || estado === "error";

  const modalRef = useRef<HTMLDialogElement>(null);
  const [desasignando, setDesasignando] = useState(false);
  const [errorDesasignar, setErrorDesasignar] = useState<string | null>(null);

  function abrirModal() {
    setErrorDesasignar(null);
    modalRef.current?.showModal();
  }

  async function confirmUnassign() {
    setDesasignando(true);
    setErrorDesasignar(null);
    try {
      await unassignMonitor(monitor.id);
      modalRef.current?.close();
      onDesasignado(monitor.id);
      toast.success(`Monitor desasignado de ${monitor.nombrePaciente}.`);
    } catch {
      const msg = "No se pudo desasignar el monitor. Intente de nuevo.";
      setErrorDesasignar(msg);
      toast.error(msg);
    } finally {
      setDesasignando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
      
      <div className={`h-1 w-full ${cfg.bar}`} />

     
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/patients/${monitor.pacienteId}`}
              className="font-semibold text-[#1A2B5E] text-sm leading-tight hover:text-[#09268E] hover:underline underline-offset-2 transition-colors"
              title="Ver ficha clínica del paciente"
            >
              {monitor.nombrePaciente}
            </Link>
            {monitor.habitacion && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Hab. {monitor.habitacion}
              </span>
            )}
            {monitor.numeroCama && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                </svg>
                Cama {monitor.numeroCama}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            {monitor.tipoActivo} · {monitor.marcaActivo} {monitor.modeloActivo}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
         
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
            <span className="relative flex h-1.5 w-1.5">
              {cfg.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-75`} />
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.dot}`} />
            </span>
            {cfg.label}
          </span>

          <button
            onClick={abrirModal}
            className="btn btn-ghost btn-xs text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 min-h-0 h-auto"
            title="Desasignar monitor"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

     
      <div className="border-t border-[#F1F5F9]" />

      
      <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
        <VitalCell
          label="Frec. Cardíaca"
          value={lectura?.frecuenciaCardiaca ?? null}
          unit="lpm"
          icon={<HeartIcon />}
          statusKey="frecuenciaCardiaca"
          dimmed={isDimmed}
        />
        <VitalCell
          label="SpO₂"
          value={lectura?.spO2 ?? null}
          unit="%"
          icon={<DropletIcon />}
          statusKey="spO2"
          dimmed={isDimmed}
        />
        <VitalCell
          label="Temperatura"
          value={lectura ? Number(lectura.temperatura).toFixed(1) : null}
          unit="°C"
          icon={<ThermometerIcon />}
          statusKey="temperatura"
          dimmed={isDimmed}
        />
      </div>

      
      <div className="grid grid-cols-3 divide-x divide-[#F1F5F9] border-t border-[#F1F5F9]">
        <VitalCell
          label="Presión Sist."
          value={lectura?.presionSistolica ?? null}
          unit="mmHg"
          icon={<PressureUpIcon />}
          statusKey="presionSistolica"
          dimmed={isDimmed}
        />
        <VitalCell
          label="Presión Diast."
          value={lectura?.presionDiastolica ?? null}
          unit="mmHg"
          icon={<PressureDownIcon />}
          statusKey="presionDiastolica"
          dimmed={isDimmed}
        />
        <VitalCell
          label="Frec. Resp."
          value={lectura?.frecuenciaRespiratoria ?? null}
          unit="rpm"
          icon={<WindIcon />}
          statusKey="frecuenciaRespiratoria"
          dimmed={isDimmed}
        />
      </div>

      
      <div className="border-t border-[#F1F5F9] px-4 py-2 flex items-center gap-1.5 min-h-[32px]">
        {lectura ? (
          <>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-xs text-slate-500">
              Actualizado:{" "}
              <span className="font-medium">
                {new Date(lectura.registradoEn).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-400 italic">Sin datos aún</span>
        )}
      </div>

      
      <dialog ref={modalRef} className="modal">
        <div className="modal-box p-0 rounded-xl max-w-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[#1A2B5E]">Desasignar monitor</h3>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas desasignar el monitor de{" "}
              <span className="font-semibold text-[#1A2B5E]">{monitor.nombrePaciente}</span>?
            </p>
            <p className="text-xs text-slate-400">
              Se detendrá la transmisión de signos vitales en tiempo real para este paciente.
            </p>

            {errorDesasignar && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errorDesasignar}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#F1F5F9]">
            <button
              className="btn btn-sm btn-ghost text-slate-500 border-none"
              onClick={() => modalRef.current?.close()}
              disabled={desasignando}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none gap-1.5 min-w-[110px]"
              onClick={confirmUnassign}
              disabled={desasignando}
            >
              {desasignando ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
              {desasignando ? "Desasignando…" : "Sí, desasignar"}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

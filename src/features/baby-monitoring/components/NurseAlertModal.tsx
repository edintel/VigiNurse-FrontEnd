"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AlertaBLEPush } from "@/features/baby-monitoring/context/BleAlertsContext";

interface Props {
  alerts: AlertaBLEPush[];
  onDismiss: () => void;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

type SevKey = "Critica" | "Alta" | "Media" | "Baja";

function parseSev(s: string): SevKey {
  if (s === "Critica" || s === "0") return "Critica";
  if (s === "Alta"    || s === "1") return "Alta";
  if (s === "Media"   || s === "2") return "Media";
  return "Baja";
}

const SEV_CFG: Record<SevKey, {
  label: string; bg: string; bar: string; textMuted: string;
  btnText: string; pulse: boolean;
}> = {
  Critica: {
    label: "🚨 CRÍTICO",
    bg: "bg-gradient-to-br from-red-950 via-red-900 to-red-800",
    bar: "bg-red-950",
    textMuted: "text-red-200",
    btnText: "text-red-900",
    pulse: true,
  },
  Alta: {
    label: "⚠️ ALTA",
    bg: "bg-gradient-to-br from-orange-950 via-orange-900 to-orange-800",
    bar: "bg-orange-950",
    textMuted: "text-orange-200",
    btnText: "text-orange-900",
    pulse: false,
  },
  Media: {
    label: "⚠️ MEDIA",
    bg: "bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700",
    bar: "bg-amber-900",
    textMuted: "text-amber-200",
    btnText: "text-amber-900",
    pulse: false,
  },
  Baja: {
    label: "ℹ️ BAJA",
    bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800",
    bar: "bg-blue-950",
    textMuted: "text-blue-200",
    btnText: "text-blue-900",
    pulse: false,
  },
};

// ─── Web Audio API beeping ────────────────────────────────────────────────────

const SOUND_CFG: Record<SevKey, {
  freq: number; vol: number; beeps: number; onMs: number; offMs: number; pauseMs: number;
}> = {
  Critica: { freq: 880, vol: 0.6,  beeps: 5, onMs: 140, offMs: 90,  pauseMs: 250 },
  Alta:    { freq: 660, vol: 0.45, beeps: 3, onMs: 190, offMs: 140, pauseMs: 450 },
  Media:   { freq: 520, vol: 0.3,  beeps: 2, onMs: 260, offMs: 200, pauseMs: 700 },
  Baja:    { freq: 420, vol: 0.2,  beeps: 1, onMs: 450, offMs: 0,   pauseMs: 1400 },
};

// Arranca un loop de sonido que repite hasta que se llame a la función devuelta
function startLoopingSound(sev: SevKey): () => void {
  const cfg = SOUND_CFG[sev];
  let stopped = false;
  let currentCtx: AudioContext | null = null;

  async function runLoop() {
    while (!stopped) {
      try {
        const Ctx = window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        currentCtx = new Ctx();
        const ctx = currentCtx;

        let t = ctx.currentTime;
        for (let i = 0; i < cfg.beeps; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = cfg.freq;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(cfg.vol, t + 0.02);
          gain.gain.setValueAtTime(cfg.vol, t + cfg.onMs / 1000 - 0.04);
          gain.gain.linearRampToValueAtTime(0, t + cfg.onMs / 1000);
          osc.start(t);
          osc.stop(t + cfg.onMs / 1000 + 0.01);
          t += (cfg.onMs + cfg.offMs) / 1000;
        }

        const cycleDuration = cfg.beeps * (cfg.onMs + cfg.offMs) + cfg.pauseMs;
        await new Promise<void>((resolve) => setTimeout(resolve, cycleDuration));
        await ctx.close().catch(() => {});
        currentCtx = null;
      } catch {
        break;
      }
    }
  }

  void runLoop();

  return () => {
    stopped = true;
    currentCtx?.close().catch(() => {});
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return iso; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NurseAlertModal({ alerts, onDismiss }: Props) {
  const router = useRouter();
  const current = alerts[0];
  const sev = parseSev(current.severidad);
  const cfg = SEV_CFG[sev];
  const stopSoundRef = useRef<(() => void) | null>(null);

  // Arranca el loop de sonido al mostrar la alerta y lo para al desmontar
  useEffect(() => {
    const stop = startLoopingSound(sev);
    stopSoundRef.current = stop;
    return () => stop();
  }, [current.id, sev]);

  const stopAndDismiss = useCallback(() => {
    stopSoundRef.current?.();
    onDismiss();
  }, [onDismiss]);

  function handleNavigate() {
    stopSoundRef.current?.();
    onDismiss();
    router.push("/baby-monitoring");
  }

  const extra = alerts.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className={["absolute inset-0 bg-black/85", cfg.pulse ? "animate-pulse" : ""].join(" ")} />

      {/* Card */}
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${cfg.bg}`}>

        {/* Header */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={["w-16 h-16 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0", cfg.pulse ? "animate-ping-slow" : ""].join(" ")}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-widest ${cfg.textMuted} mb-0.5`}>Alerta BLE — Neonatos</p>
              <p className="text-white text-3xl font-black leading-none">{cfg.label}</p>
            </div>

            {extra > 0 && (
              <div className="flex-shrink-0 bg-white/20 text-white text-xs font-bold rounded-full px-3 py-1 self-start">
                +{extra} más
              </div>
            )}
          </div>

          <p className="text-white text-lg font-semibold mt-4 leading-snug">
            {current.descripcion}
          </p>
        </div>

        {/* Details row */}
        <div className={`${cfg.bar} px-6 py-4 grid grid-cols-1 gap-2`}>
          {current.pacienteId && (
            <DetailRow label="Paciente" value={`#${current.pacienteId}`} muted={cfg.textMuted} />
          )}
          {current.zonaNombre && (
            <DetailRow label="Zona" value={current.zonaNombre} muted={cfg.textMuted} />
          )}
          <DetailRow label="Hora" value={formatHora(current.fechaCreacion)} muted={cfg.textMuted} />
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3">
          <button
            type="button"
            onClick={handleNavigate}
            className={`flex-1 bg-white ${cfg.btnText} font-black rounded-xl py-3.5 text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2 cursor-pointer`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
            </svg>
            Ver alertas ahora
          </button>
          <button
            type="button"
            onClick={stopAndDismiss}
            className="px-5 bg-white/15 text-white font-semibold rounded-xl py-3.5 text-sm hover:bg-white/25 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${muted} w-16 flex-shrink-0`}>{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

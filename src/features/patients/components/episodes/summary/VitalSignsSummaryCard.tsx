"use client";
import { useCallback, useEffect, useState } from "react";
import { type SignoVital } from "@/features/patients/types";
import { getEpisodeVitalSigns } from "@/features/patients/services/vitalSignService";
import { toast } from "@/lib/toast";



function normalizeName(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
}

// Identifica si el signo es de tipo presión arterial (sistólica o diastólica)
function isBPTipo(nombre: string) {
  const n = normalizeName(nombre);
  return n.includes("sistol") || n.includes("diastol");
}

// Verifica si un valor está fuera del rango normal definido por mínimo y máximo
function isOutOfRange(valor: number, min: number, max: number) {
  return valor < min || valor > max;
}

function formatSignoDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

interface BPPair {
  sistolica: SignoVital;
  diastolica: SignoVital;
}

function buildCards(signos: SignoVital[]): {
  bpPair: BPPair | null;
  regular: SignoVital[];
} {
  if (signos.length === 0) return { bpPair: null, regular: [] };

  const sorted = [...signos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  const bpSignos = sorted.filter((s) => isBPTipo(s.tipoSignoNombre));
  const regularSignos = sorted.filter((s) => !isBPTipo(s.tipoSignoNombre));

  const seen = new Set<number>();
  const recent: SignoVital[] = [];
  for (const s of regularSignos) {
    if (!seen.has(s.tipoSignoId)) {
      seen.add(s.tipoSignoId);
      recent.push(s);
    }
  }

  const sistolica = bpSignos.find((s) =>
    normalizeName(s.tipoSignoNombre).includes("sistol"),
  );
  const diastolica = bpSignos.find((s) =>
    normalizeName(s.tipoSignoNombre).includes("diastol"),
  );
  const bpPair = sistolica && diastolica ? { sistolica, diastolica } : null;

  return { bpPair, regular: recent };
}

// Componente para mostrar un signo vital individual en formato compacto, con indicación de si está fuera de rango y la fecha de registro.


function VitalMiniCard({
  label,
  value,
  unit,
  outOfRange,
  fecha,
  onClick,
}: {
  label: string;
  value: string;
  unit: string;
  outOfRange: boolean;
  fecha: string;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={`flex flex-col gap-1.5 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm min-w-0 transition-colors ${onClick ? "cursor-pointer hover:border-[#09268E]/40 hover:shadow-md" : ""}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] leading-tight">
          {label}
        </span>
        {outOfRange ? (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold text-center bg-[#fee2e2] text-[#dc2626]">
            Alerta
          </span>
        ) : (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold text-center bg-[#dcfce7] text-[#16a34a]">
            Normal
          </span>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span
          className={`text-2xl font-bold leading-none ${outOfRange ? "text-[#dc2626]" : "text-[#0f172a]"}`}
        >
          {value}
        </span>
        <span className="text-xs font-medium text-[#94a3b8] mb-0.5">{unit}</span>
      </div>

      <p className="text-[10px] text-[#b0bec5] mt-0.5">{formatSignoDate(fecha)}</p>
    </div>
  );
}

// Componente principal para mostrar un resumen de los signos vitales recientes de un episodio.
export function VitalSignsSummaryCard({
  episodioId,
  onGoToSignos,
}: {
  episodioId: number;
  onGoToSignos?: () => void;
}) {
  const [signos, setSignos] = useState<SignoVital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (showFeedback = false) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getEpisodeVitalSigns(episodioId);
      setSignos(data);
      if (showFeedback) {
        toast.success("Signos vitales actualizados.");
      }
    } catch {
      setError(true);
      if (showFeedback) {
        toast.error("No se pudieron cargar los signos vitales.");
      }
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { bpPair, regular } = buildCards(signos);
  const hasData = bpPair !== null || regular.length > 0;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">

      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]/50 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="#64748b"
          className="size-4 flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
          Signos Vitales Recientes
        </span>
        {hasData && !loading && (
          <span className="ml-auto text-[10px] font-semibold text-[#94a3b8]">
            Última lectura por tipo
          </span>
        )}
      </div>


      <div className="p-5">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md text-[#09268E]" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-7">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#f87171"
              className="size-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-[#94a3b8]">No se pudieron cargar los signos vitales.</p>
            <button
              className="btn btn-xs btn-ghost text-[#09268E]"
              onClick={() => void load(true)}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className="flex flex-col items-center gap-2 py-7">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.4"
              stroke="#cbd5e1"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
            <p className="text-sm font-medium text-[#94a3b8]">
              Sin registros de signos vitales
            </p>
            <p className="text-xs text-[#b0bec5]">
              Los signos vitales registrados en este episodio aparecerán aquí.
            </p>
          </div>
        )}

        {!loading && !error && hasData && (
          <div className="grid grid-cols-2 gap-3">
            {bpPair && (
              <VitalMiniCard
                label="Presión arterial"
                value={`${bpPair.sistolica.valor}/${bpPair.diastolica.valor}`}
                unit={bpPair.sistolica.unidad}
                outOfRange={
                  isOutOfRange(
                    bpPair.sistolica.valor,
                    bpPair.sistolica.minimoNormal,
                    bpPair.sistolica.maximoNormal,
                  ) ||
                  isOutOfRange(
                    bpPair.diastolica.valor,
                    bpPair.diastolica.minimoNormal,
                    bpPair.diastolica.maximoNormal,
                  )
                }
                fecha={bpPair.sistolica.fecha}
                onClick={onGoToSignos}
              />
            )}
            {regular.map((s) => (
              <VitalMiniCard
                key={s.id}
                label={s.tipoSignoNombre}
                value={String(s.valor)}
                unit={s.unidad}
                outOfRange={isOutOfRange(s.valor, s.minimoNormal, s.maximoNormal)}
                fecha={s.fecha}
                onClick={onGoToSignos}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

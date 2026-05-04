import { useEffect, useRef, useState } from "react";
import { EstadoDisponibilidadPersonal } from "@/features/staff-monitoring/types";
import { ESTADO_CONFIG, ESTADO_OPTIONS } from "./staffHomeConfig";


// Componente para mostrar y cambiar el estado de disponibilidad del personal en el dashboard. 
export function AvailabilityDropdown({
  estado,
  saving,
  onSelect,
}: {
  estado: EstadoDisponibilidadPersonal | null;
  saving: boolean;
  onSelect: (e: EstadoDisponibilidadPersonal) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const cfg = estado !== null && estado !== undefined ? ESTADO_CONFIG[estado] : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition cursor-pointer disabled:opacity-60 ${
          cfg ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "bg-slate-100 border-slate-200 text-slate-500"
        }`}
      >
        {saving ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <span className={`size-2 rounded-full shrink-0 ${cfg?.dot ?? "bg-slate-400"}`} />
        )}
        <span>{cfg?.label ?? "Sin estado"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-3.5 opacity-60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white rounded-xl border border-[#e2e8f0] shadow-lg overflow-hidden">
          {ESTADO_OPTIONS.map((opt) => {
            const c = ESTADO_CONFIG[opt];
            const isActive = estado === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition cursor-pointer hover:bg-[#f8fafc] ${isActive ? "bg-[#f8fafc]" : ""}`}
              >
                <span className={`size-2 rounded-full shrink-0 ${c.dot}`} />
                <span className="text-[#0f172a]">{c.label}</span>
                {isActive && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-[#09268E] ml-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

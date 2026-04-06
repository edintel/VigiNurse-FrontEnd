"use client";
import { useCallback, useEffect, useState } from "react";
import { MedicacionEstado, type Medicacion } from "@/features/patients/types";
import { getMedicacion, getAdministraciones } from "@/features/patients/services/medicacionService";


const MAX_MED_VISIBLE = 3;

// Calcula la fecha de la próxima dosis sumando la frecuencia a la última suministracion (o a la fecha de inicio si no hay suministraciones). 

async function nextDoseDate(episodioId: number, m: Medicacion): Promise<Date | null> {
  try {
    const data = await getAdministraciones(episodioId, m.id);
    const baseStr =
      data.length === 0
        ? m.fechaInicio
        : data.reduce((a, b) =>
            new Date(a.fechaAdministracion) > new Date(b.fechaAdministracion)
              ? a
              : b,
          ).fechaAdministracion;
    const base = new Date(baseStr);
    if (Number.isNaN(base.getTime())) return null;
    return new Date(base.getTime() + m.frecuenciaHoras * 60 * 60 * 1000);
  } catch {
    return null;
  }
}

function formatProxima(date: Date): string {
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Componente que muestra un resumen de la medicación activa del episodio, con la próxima dosis y un botón para ir a la sección de medicación.

export function MedicacionActivaResumenCard({
  episodioId,
  onGoToMedicacion,
}: {
  episodioId: number;
  onGoToMedicacion?: () => void;
}) {
  const [items, setItems] = useState<{ med: Medicacion; proxima: Date | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getMedicacion(episodioId, { estado: MedicacionEstado.Activa });

      const resolved = await Promise.all(
        data.map(async (med) => ({
          med,
          proxima: await nextDoseDate(episodioId, med),
        })),
      );

      resolved.sort((a, b) => {
        const timeA = a.proxima?.getTime() ?? Number.POSITIVE_INFINITY;
        const timeB = b.proxima?.getTime() ?? Number.POSITIVE_INFINITY;
        return timeA - timeB;
      });

      setItems(resolved);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = items.slice(0, MAX_MED_VISIBLE);
  const extra = items.length - MAX_MED_VISIBLE;

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
            d="m15 11.25-6.75-6.75a3.182 3.182 0 0 0-4.5 4.5l6.75 6.75M15 11.25l2.25 2.25M15 11.25l2.625 2.625a3.182 3.182 0 1 0 4.5-4.5L19.5 6.75M9 15l-2.25 2.25M9 15l-2.625 2.625a3.182 3.182 0 0 1-4.5-4.5L4.5 10.5"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
          Medicación Activa
        </span>
        {items.length > 0 && !loading && (
          <span className="ml-auto text-[10px] font-semibold text-[#94a3b8]">
            {items.length} prescripción{items.length !== 1 ? "es" : ""}
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
            <p className="text-sm text-[#94a3b8]">No se pudo cargar la medicación.</p>
            <button className="btn btn-xs btn-ghost text-[#09268E]" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
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
                d="m15 11.25-6.75-6.75a3.182 3.182 0 0 0-4.5 4.5l6.75 6.75M15 11.25l2.25 2.25M15 11.25l2.625 2.625a3.182 3.182 0 1 0 4.5-4.5L19.5 6.75M9 15l-2.25 2.25M9 15l-2.625 2.625a3.182 3.182 0 0 1-4.5-4.5L4.5 10.5"
              />
            </svg>
            <p className="text-sm font-medium text-[#94a3b8]">Sin medicación activa</p>
            <p className="text-xs text-[#b0bec5]">
              Las prescripciones activas del episodio aparecerán aquí.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {visible.map(({ med: m, proxima }) => {
              const diffMs = proxima != null ? proxima.getTime() - Date.now() : null;
              const isOverdue = diffMs != null && diffMs < 0;
              const isSoon = diffMs != null && diffMs >= 0 && diffMs < 30 * 60 * 1000;
              const doseColor = isOverdue ? "#dc2626" : isSoon ? "#ea580c" : null;
              return (
                <div
                  key={m.id}
                  role={onGoToMedicacion ? "button" : undefined}
                  tabIndex={onGoToMedicacion ? 0 : undefined}
                  onClick={onGoToMedicacion}
                  onKeyDown={
                    onGoToMedicacion
                      ? (e) => { if (e.key === "Enter" || e.key === " ") onGoToMedicacion(); }
                      : undefined
                  }
                  className={`flex items-center justify-between gap-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-4 py-3 transition-colors ${onGoToMedicacion ? "cursor-pointer hover:border-[#09268E]/30 hover:bg-[#f0f4ff]" : ""}`}
                >
                  {/* Nombre + dosis */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1e293b] truncate">
                      {m.medicamentoNombre}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {m.dosis} {m.unidadMedida} · cada {m.frecuenciaHoras}h
                    </p>
                  </div>

                 
                  <div className="text-right shrink-0">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.4px] mb-0.5"
                      style={{ color: doseColor ?? "#94a3b8" }}
                    >
                      Próxima dosis
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: doseColor ?? "#475569" }}
                    >
                      {proxima ? formatProxima(proxima) : "—"}
                    </p>
                  </div>
                </div>
              );
            })}

            {extra > 0 && (
              <button
                type="button"
                onClick={onGoToMedicacion}
                className="w-full text-center text-xs font-semibold text-[#09268E] hover:underline pt-1"
              >
                +{extra} más — ver todas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

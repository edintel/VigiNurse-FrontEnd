"use client";
import { useCallback, useEffect, useState } from "react";
import { OrdenEstado, TIPO_ORDEN_LABELS, type Dato } from "@/features/patients/types";
import { getEpisodeOrders } from "@/features/patients/services/orderService";
import { toast } from "@/lib/toast";



const MAX_ORDEN_VISIBLE = 3;


// Componente que muestra un resumen de las órdenes completadas en un episodio, con su tipo, descripción, ejecutante y fecha de ejecución.
// Permite navegar a la sección de órdenes si se hace click en alguna orden o en el botón de "ver todas".
export function OrdersSummaryCard({
  episodioId,
  onGoToOrders,
}: {
  episodioId: number;
  onGoToOrders?: () => void;
}) {
  const [ordenes, setOrdenes] = useState<Dato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (showFeedback = false) => {
    setLoading(true);
    setError(false);
    try {
      const result = await getEpisodeOrders(
        episodioId,
        { estado: OrdenEstado.Completada },
        1,
        50,
      );
      const sorted = [...result.datos].sort((a, b) => {
        const ta = a.fechaEjecucion ? new Date(a.fechaEjecucion).getTime() : 0;
        const tb = b.fechaEjecucion ? new Date(b.fechaEjecucion).getTime() : 0;
        return tb - ta;
      });
      setOrdenes(sorted);
      if (showFeedback) {
        toast.success("Órdenes actualizadas.");
      }
    } catch {
      setError(true);
      if (showFeedback) {
        toast.error("No se pudieron cargar las órdenes.");
      }
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = ordenes.slice(0, MAX_ORDEN_VISIBLE);
  const extra = ordenes.length - MAX_ORDEN_VISIBLE;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header */}
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
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
          Órdenes Completadas
        </span>
        {ordenes.length > 0 && !loading && (
          <span className="ml-auto text-[10px] font-semibold text-[#94a3b8]">
            {ordenes.length} completada{ordenes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Body */}
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
            <p className="text-sm text-[#94a3b8]">No se pudieron cargar las órdenes.</p>
            <button className="btn btn-xs btn-ghost text-[#09268E]" onClick={() => void load(true)}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && ordenes.length === 0 && (
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
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <p className="text-sm font-medium text-[#94a3b8]">Sin órdenes completadas</p>
            <p className="text-xs text-[#b0bec5]">
              Las órdenes ejecutadas aparecerán aquí.
            </p>
          </div>
        )}

        {!loading && !error && ordenes.length > 0 && (
          <div className="space-y-2">
            {visible.map((o, idx) => (
              <div
                key={o.id}
                role={onGoToOrders ? "button" : undefined}
                tabIndex={onGoToOrders ? 0 : undefined}
                onClick={onGoToOrders}
                onKeyDown={
                  onGoToOrders
                    ? (e) => { if (e.key === "Enter" || e.key === " ") onGoToOrders(); }
                    : undefined
                }
                className={`flex items-center justify-between gap-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-4 py-3 transition-colors ${onGoToOrders ? "cursor-pointer hover:border-[#09268E]/30 hover:bg-[#f0f4ff]" : ""}`}
                style={idx === 0 ? { borderLeftWidth: "4px", borderLeftColor: "#00d390" } : undefined}
              >
                {/* Tipo + descripción */}
                <div className="min-w-0 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1e293b] truncate">
                      {TIPO_ORDEN_LABELS[o.tipoOrden as keyof typeof TIPO_ORDEN_LABELS] ?? "—"} · {o.categoria}
                    </p>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5">
                      {o.descripcion}
                    </p>
                  </div>
                </div>

                {/* Ejecutado por + fecha ejecución */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[#475569] truncate max-w-[140px]">
                    Ejecutante: {o.ejecutanteNombre ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#94a3b8] mt-0.5">
                    {o.fechaEjecucion
                      ? new Date(o.fechaEjecucion).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            ))}

            {extra > 0 && (
              <button
                type="button"
                onClick={onGoToOrders}
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

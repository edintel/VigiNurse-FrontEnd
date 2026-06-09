"use client";
import { useEffect, useState } from "react";
import { getDischargeNote } from "@/features/patients/services/episodeService";
import type { RecetaAlta, RecetaAltaDetalleResponse } from "@/features/patients/types";
import { toast } from "@/lib/toast";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

// Componente para mostrar cada medicamento de la receta
function MedicationCard({
  detalle,
  index,
}: {
  detalle: RecetaAltaDetalleResponse;
  index: number;
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
      {/* Header del medicamento */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#f8fafc] border-b border-[#f1f5f9]">
        <span className="w-6 h-6 rounded-full bg-[#1A2B5E] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {index + 1}
        </span>
        <span className="text-sm font-bold text-[#0f172a]">
          {detalle.medicamentoNombre}
        </span>
      </div>

      {/* Datos de la receta */}
      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
              Dosis
            </p>
            <p className="text-sm font-semibold text-[#334155]">{detalle.dosis}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
              Frecuencia
            </p>
            <p className="text-sm font-semibold text-[#334155]">{detalle.frecuencia}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
              Duración
            </p>
            <p className="text-sm font-semibold text-[#334155]">{detalle.duracion}</p>
          </div>
        </div>

        {detalle.instrucciones && (
          <div className="pt-1 border-t border-[#f1f5f9]">
            <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
              Instrucciones
            </p>
            <p className="text-sm text-[#475569]">{detalle.instrucciones}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal para mostrar la receta de alta de un episodio
interface Props {
  episodioId: number;
}

export function DischargeTab({ episodioId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receta, setReceta] = useState<RecetaAlta | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDischargeNote(episodioId);
        if (!cancelled) setReceta(data);
      } catch {
        if (!cancelled) {
          const msg = "No se pudo cargar la receta de alta.";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [episodioId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-md text-[#09268E]" />
      </div>
    );
  }


  if (error) {
    return (
      <div role="alert" className="alert alert-error text-sm py-3">
        <span>{error}</span>
      </div>
    );
  }

  if (!receta) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#94a3b8"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#64748b]">Sin receta de alta</p>
        <p className="text-xs text-[#94a3b8] max-w-xs">
          Este episodio no tiene una receta de alta registrada.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-5">
      {/* Encabezado de la receta */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="#2563eb"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#0f172a]">Receta de alta</p>
            <p className="text-xs text-[#64748b]">
              Prescrita por{" "}
              <span className="font-semibold text-[#334155]">{receta.doctorNombre}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
            Fecha de emisión
          </p>
          <p className="text-xs font-semibold text-[#475569]">
            {formatDate(receta.fechaCreacion)}
          </p>
        </div>
      </div>

      {/* Lista de medications */}
      <div className="space-y-3">
        {receta.detalles.map((d, i) => (
          <MedicationCard key={d.id} detalle={d} index={i} />
        ))}
      </div>

      {/* Footer: total de medications */}
      <p className="text-xs text-[#94a3b8] text-right">
        {receta.detalles.length} medicamento{receta.detalles.length !== 1 ? "s" : ""} recetado{receta.detalles.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

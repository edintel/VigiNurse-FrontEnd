"use client";
import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { getEpisodeById } from "@/features/patients/services/episodeService";
import { DiagnosticsTab } from "@/features/patients/components/diagnostics/DiagnosticsTab";
import { MedicationTab } from "@/features/patients/components/medication/MedicationTab";
import { OrdersTab } from "@/features/patients/components/orders/OrdersTab";
import { VitalSignsTab } from "@/features/patients/components/vitalSigns/VitalSignsTab";
import { ClinicalEvolutionTab } from "@/features/patients/components/clinicalEvolution/ClinicalEvolutionTab";
import { NursingNotesTab } from "@/features/patients/components/nursingNotes/NursingNotesTab";
import { DischargeTab } from "@/features/patients/components/episodes/DischargeTab";
import { toast } from "@/lib/toast";
import {
  EpisodioEstado,
  ESTADO_EPISODIO_CONFIG,
  TRIAGE_CONFIG,
  TIPO_EPISODIO_LABELS,
} from "@/features/patients/types";
import type { EpisodioHistorial } from "@/features/patients/types";

// Definición de las tabs disponibles en el detalle del episodio, con su respectiva función de renderizado.
type DetailTab =
  | "diagnosticos"
  | "medicacion"
  | "ordenes"
  | "signos"
  | "evoluciones"
  | "notas"
  | "receta";

type TabProps = { pacienteId: number; episodio: EpisodioHistorial };

const DETAIL_TABS: {
  id: DetailTab;
  label: string;
  render: (ctx: TabProps) => ReactElement;
}[] = [
  {
    id: "diagnosticos",
    label: "Diagnósticos",
    render: ({ episodio }) => <DiagnosticsTab episodio={episodio} />,
  },
  {
    id: "medicacion",
    label: "Medicación",
    render: ({ episodio }) => (
      <MedicationTab
        episodioId={episodio.id}
        canCreate={episodio.estado === EpisodioEstado.EnCurso}
      />
    ),
  },
  {
    id: "ordenes",
    label: "Órdenes",
    render: ({ episodio }) => (
      <OrdersTab
        episodio={episodio}
        canCreate={episodio.estado === EpisodioEstado.EnCurso}
      />
    ),
  },
  {
    id: "signos",
    label: "Signos Vitales",
    render: ({ episodio }) => (
      <VitalSignsTab
        episodioId={episodio.id}
        canCreate={episodio.estado === EpisodioEstado.EnCurso}
      />
    ),
  },
  {
    id: "evoluciones",
    label: "Evoluciones",
    render: ({ episodio }) => (
      <ClinicalEvolutionTab episodioId={episodio.id} episodio={episodio} />
    ),
  },
  {
    id: "notas",
    label: "Notas de enfermería",
    render: ({ episodio }) => (
      <NursingNotesTab episodioId={episodio.id} episodio={episodio} />
    ),
  },
  {
    id: "receta",
    label: "Receta de alta",
    render: ({ episodio }) => <DischargeTab episodioId={episodio.id} />,
  },
];

// Formatea una fecha ISO a DD/MM/AAAA HH:MM.
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
}

// Par etiqueta-valor para la card de resumen del episodio.
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[#334155]">
        {value ?? "—"}
      </span>
    </div>
  );
}

// Badge del estado del episodio.
function EstadoBadge({ estado }: { estado: EpisodioEstado }) {
  const cfg =
    ESTADO_EPISODIO_CONFIG[estado] ??
    ESTADO_EPISODIO_CONFIG[EpisodioEstado.Pendiente];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.bgCls} ${cfg.borderCls} ${cfg.textCls}`}
    >
      {cfg.label}
    </span>
  );
}

interface EpisodeDetailPageProps {
  pacienteId: number;
  episodioId: number;
}

// Página de detalle de un episodio específico.
export default function EpisodeDetailPage({
  pacienteId,
  episodioId,
}: EpisodeDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("diagnosticos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [episodio, setEpisodio] = useState<EpisodioHistorial | null>(null);


  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/patients/${pacienteId}/historial`);
  }

  // Función para cargar el detalle del episodio, con manejo de estados de carga y error.
  const loadData = useCallback(async (showFeedback = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEpisodeById(episodioId);
      setEpisodio(data);
      if (showFeedback) {
        toast.success("Detalle del episodio actualizado.");
      }
    } catch {
      const msg = "No se pudo cargar el detalle del episodio. Intente nuevamente.";
      setError(msg);
      if (showFeedback) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }

  // Estado de error
  if (error || !episodio) {
    return (
      <div className="py-6 px-8 xl:px-12">
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error ?? "No se encontró el episodio."}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void loadData(true)}
            >
              Reintentar
            </button>
        </div>
      </div>
    );
  }

  const triageCfg = TRIAGE_CONFIG[episodio.nivelTriage];
  const activeTabDef =
    DETAIL_TABS.find((t) => t.id === activeTab) ?? DETAIL_TABS[0];

  return (
    <div>
      {/* Sub-encabezado del detalle */}
      <div className="border-b border-[#e2e8f0] bg-white px-8 xl:px-12 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="btn btn-sm btn-ghost btn-circle text-[#64748b] hover:text-[#1A2B5E]"
            title="Volver"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#0f172a] leading-tight">
                Detalle del Episodio
              </h1>
              <span className="text-xs font-mono text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5">
                #{episodio.id}
              </span>
              <EstadoBadge estado={episodio.estado} />
            </div>
            <p className="text-sm text-[#64748b] mt-0.5">
              {episodio.pacienteNombre}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="py-6 px-8 xl:px-12 space-y-4">
        {/* Card de resumen del episodio */}
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
              Resumen del episodio
            </span>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {/* Fila de identificación: Tipo | Estado | Triage | Área | Hospital */}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
              <Field
                label="Tipo"
                value={TIPO_EPISODIO_LABELS[episodio.tipo] ?? "—"}
              />
              <Field
                label="Estado"
                value={<EstadoBadge estado={episodio.estado} />}
              />
              <Field
                label="Nivel de triage"
                value={
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${triageCfg.bgCls} ${triageCfg.borderCls} ${triageCfg.textCls}`}
                  >
                    {episodio.nivelTriage} — {triageCfg.label}
                  </span>
                }
              />
              <Field label="Área" value={episodio.areaNombre} />
              <Field label="Hospital" value={episodio.hospitalNombre} />
            </div>

            {/* Grupo ingreso */}
            <div className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#09268E] mb-3">
                Ingreso
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <Field
                  label="Fecha de admisión"
                  value={formatDate(episodio.fechaAdmision)}
                />
                <Field
                  label="Admitido por"
                  value={episodio.admitidoPorNombre}
                />
                <Field label="Razón de visita" value={episodio.razonVisita} />
              </div>
            </div>

            {/* Grupo cierre — solo si el episodio está finalizado */}
            {(episodio.fechaSalida ??
              episodio.finalizadoPorNombre ??
              episodio.razonFinalizacion) && (
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#09268E] mb-3">
                  Cierre
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <Field
                    label="Fecha de salida"
                    value={formatDate(episodio.fechaSalida)}
                  />
                  <Field
                    label="Finalizado por"
                    value={episodio.finalizadoPorNombre}
                  />
                  <Field
                    label="Comentarios de cierre"
                    value={episodio.razonFinalizacion}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de tabs del episodio */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="flex gap-1 border-b border-[#D1D9E6] px-4 overflow-x-auto">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "px-4 py-3 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-[#09268E] border-[#09268E]"
                    : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTabDef.render({ pacienteId, episodio })}
          </div>
        </div>
      </div>
    </div>
  );
}

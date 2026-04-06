"use client";
import { useRouter } from "next/navigation";
import { EpisodioHistorialTab } from "@/features/patients/components/episodios/EpisodioHistorialTab";

interface HistorialPageProps {
  pacienteId: number;
}

export default function HistorialPage({ pacienteId }: HistorialPageProps) {
  const router = useRouter();

  return (
    <div>
      {/* Sub-header */}
      <div className="border-b border-[#e2e8f0] bg-white px-8 xl:px-12 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/patients/${pacienteId}`)}
            className="btn btn-sm btn-ghost btn-circle text-[#64748b] hover:text-[#1A2B5E]"
            title="Volver a la ficha del paciente"
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
            <h1 className="text-lg font-bold text-[#0f172a] leading-tight">
              Historial médico
            </h1>
            <p className="text-xs text-[#64748b] mt-0.5">
              Registro histórico de episodios de atención
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6 px-8 xl:px-12">
        <EpisodioHistorialTab pacienteId={pacienteId} />
      </div>
    </div>
  );
}

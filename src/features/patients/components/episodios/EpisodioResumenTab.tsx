"use client";
import { type EpisodioHistorial } from "@/features/patients/types";
import { EpisodioInfoCard } from "./resumen/EpisodioInfoCard";
import { SignosVitalesResumenCard } from "./resumen/SignosVitalesResumenCard";
import { MedicacionActivaResumenCard } from "./resumen/MedicacionActivaResumenCard";
import { DiagnosticosResumenCard } from "./resumen/DiagnosticosResumenCard";
import { OrdenesResumenCard } from "./resumen/OrdenesResumenCard";

interface EpisodioResumenTabProps {
  episodio: EpisodioHistorial;
  onGoToSignos?: () => void;
  onGoToMedicacion?: () => void;
  onGoToDiagnosticos?: () => void;
  onGoToOrdenes?: () => void;
}

export function EpisodioResumenTab({
  episodio,
  onGoToSignos,
  onGoToMedicacion,
  onGoToDiagnosticos,
  onGoToOrdenes,
}: EpisodioResumenTabProps) {
  return (
    <div className="space-y-4">
      <EpisodioInfoCard episodio={episodio} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignosVitalesResumenCard episodioId={episodio.id} onGoToSignos={onGoToSignos} />
        <MedicacionActivaResumenCard episodioId={episodio.id} onGoToMedicacion={onGoToMedicacion} />
        <DiagnosticosResumenCard episodioId={episodio.id} onGoToDiagnosticos={onGoToDiagnosticos} />
        <OrdenesResumenCard episodioId={episodio.id} onGoToOrdenes={onGoToOrdenes} />
      </div>
    </div>
  );
}

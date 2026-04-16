"use client";
import { type EpisodioHistorial } from "@/features/patients/types";
import { EpisodeInfoCard } from "./summary/EpisodeInfoCard";
import { VitalSignsSummaryCard } from "./summary/VitalSignsSummaryCard";
import { ActiveMedicationSummaryCard } from "./summary/ActiveMedicationSummaryCard";
import { DiagnosticsSummaryCard } from "./summary/DiagnosticsSummaryCard";
import { OrdersSummaryCard } from "./summary/OrdersSummaryCard";

interface EpisodeSummaryTabProps {
  episodio: EpisodioHistorial;
  onGoToSignos?: () => void;
  onGoToMedication?: () => void;
  onGoToDiagnostics?: () => void;
  onGoToOrders?: () => void;
}

export function EpisodeSummaryTab({
  episodio,
  onGoToSignos,
  onGoToMedication,
  onGoToDiagnostics,
  onGoToOrders,
}: EpisodeSummaryTabProps) {
  return (
    <div className="space-y-4">
      <EpisodeInfoCard episodio={episodio} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VitalSignsSummaryCard episodioId={episodio.id} onGoToSignos={onGoToSignos} />
        <ActiveMedicationSummaryCard episodioId={episodio.id} onGoToMedication={onGoToMedication} />
        <DiagnosticsSummaryCard episodioId={episodio.id} onGoToDiagnostics={onGoToDiagnostics} />
        <OrdersSummaryCard episodioId={episodio.id} onGoToOrders={onGoToOrders} />
      </div>
    </div>
  );
}

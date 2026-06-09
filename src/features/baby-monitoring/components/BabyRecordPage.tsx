"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHasPermission } from "@/lib/hasPermission";
import { getBabyById } from "@/features/baby-monitoring/services/babyService";
import { getEpisodeById } from "@/features/patients/services/episodeService";
import { BabyInfoCard } from "@/features/baby-monitoring/components/BabyInfoCard";
import { EpisodeSummaryTab } from "@/features/patients/components/episodes/EpisodeSummaryTab";
import { DiagnosticsTab } from "@/features/patients/components/diagnostics/DiagnosticsTab";
import { MedicationTab } from "@/features/patients/components/medication/MedicationTab";
import { OrdersTab } from "@/features/patients/components/orders/OrdersTab";
import { VitalSignsTab } from "@/features/patients/components/vitalSigns/VitalSignsTab";
import { ClinicalEvolutionTab } from "@/features/patients/components/clinicalEvolution/ClinicalEvolutionTab";
import { NursingNotesTab } from "@/features/patients/components/nursingNotes/NursingNotesTab";
import { MedicalImagesTab } from "@/features/patients/components/medicalImages/MedicalImagesTab";
import { AssignEpisodeDoctorModal } from "@/features/patients/components/episodes/AssignEpisodeDoctorModal";
import { EpisodioEstado, type EpisodioHistorial } from "@/features/patients/types";
import type { Bebe } from "@/features/baby-monitoring/types";

type BabyTab =
  | "informacion"
  | "resumen"
  | "diagnosticos"
  | "medicacion"
  | "ordenes"
  | "signos"
  | "evolucion"
  | "notas"
  | "imagenes";

const BABY_TABS: { id: BabyTab; label: string }[] = [
  { id: "informacion", label: "Información" },
  { id: "resumen", label: "Resumen" },
  { id: "diagnosticos", label: "Diagnósticos" },
  { id: "medicacion", label: "Medicación" },
  { id: "ordenes", label: "Órdenes" },
  { id: "signos", label: "Signos Vitales" },
  { id: "evolucion", label: "Evolución" },
  { id: "notas", label: "Notas" },
  { id: "imagenes", label: "Imágenes" },
];

function calcularEdadNeonatal(fechaNacimiento: string): string {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  const totalDias = Math.floor((hoy.getTime() - nac.getTime()) / 86400000);
  if (totalDias === 0) return "Recién nacido";
  if (totalDias < 28) return `${totalDias} día${totalDias !== 1 ? "s" : ""}`;
  const meses =
    hoy.getMonth() -
    nac.getMonth() +
    12 * (hoy.getFullYear() - nac.getFullYear());
  if (meses < 12) return `${meses} mes${meses !== 1 ? "es" : ""}`;
  const anios = Math.floor(meses / 12);
  const mesesRest = meses % 12;
  return mesesRest === 0
    ? `${anios} año${anios !== 1 ? "s" : ""}`
    : `${anios} año${anios !== 1 ? "s" : ""} y ${mesesRest} mes${mesesRest !== 1 ? "es" : ""}`;
}

interface BabyRecordPageProps {
  id: number;
}

// Componente principal de la ficha del bebé, con tabs para cada sección de información relevante 
// (diagnósticos, medicación, signos vitales, etc).
export default function BabyRecordPage({ id }: BabyRecordPageProps) {
  const router = useRouter();

  const canAssignEpisodeDoctor = useHasPermission("patients.episodesAssignDoctor");
  const canCreateDiagnostics = useHasPermission("patients.diagnosticsCreate");
  const canCreateMedication = useHasPermission("patients.medicationCreate");
  const canAdministerMedication = useHasPermission("patients.medicationAdminister");
  const canChangeMedicationState = useHasPermission("patients.medicationChangeState");
  const canCreateOrders = useHasPermission("patients.ordersCreate");
  const canChangeOrderState = useHasPermission("patients.ordersChangeState");
  const canViewImages = useHasPermission("patients.medicalImagesView");
  const canCreateVitalSigns = useHasPermission("patients.vitalSignsCreate");
  const canCreateClinicalEvolution = useHasPermission("patients.clinicalEvolutionCreate");
  const canCreateNursingNotes = useHasPermission("patients.nursingNotesCreate");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bebe, setBebe] = useState<Bebe | null>(null);
  const [episodio, setEpisodio] = useState<EpisodioHistorial | null>(null);

  const [activeTab, setActiveTab] = useState<BabyTab>("resumen");
  const [doctorModalMode, setDoctorModalMode] = useState<"principal" | "actual">("principal");
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bebeData = await getBabyById(id);
      const episodioData = await getEpisodeById(bebeData.episodioId);
      setBebe(bebeData);
      setEpisodio(episodioData);
    } catch {
      setError("No se pudo cargar la ficha del bebé. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }

  if (error || !bebe || !episodio) {
    return (
      <div className="py-6 px-8 xl:px-12">
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error ?? "No se encontró la ficha del bebé."}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void loadData()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const edadNeonatal = calcularEdadNeonatal(bebe.fechaNacimiento);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* ── Header fijo ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 sticky top-0 z-10 bg-white">
        <div className="border-b border-[#e2e8f0] px-8 xl:px-12 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: back + baby name + chips */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/baby-monitoring")}
                className="btn btn-sm btn-ghost btn-circle text-[#64748b] hover:text-[#1A2B5E]"
                title="Volver a Control de Bebés"
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
                  {bebe.apellidos}, {bebe.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* Edad neonatal */}
                  <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5">
                    {edadNeonatal}
                  </span>
                  {/* Estado */}
                  {bebe.activo ? (
                    <span className="text-[11px] font-semibold uppercase bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5">
                      Internado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold uppercase bg-slate-50 text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">
                      Alta
                    </span>
                  )}
                  {/* IDs */}
                  <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5 font-mono">
                    Bebé #{bebe.id}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5 font-mono">
                    Paciente #{bebe.pacienteId}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5 font-mono">
                    Episodio #{bebe.episodioId}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: action */}
            <button
              type="button"
              className="btn btn-sm btn-outline border-[#09268E] text-[#09268E] hover:bg-[#09268E] hover:text-white"
              onClick={() => router.push(`/patients/${bebe.pacienteId}`)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="size-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Ver ficha de paciente
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#D1D9E6] px-8 xl:px-12 overflow-x-auto">
          {BABY_TABS.filter((tab) => tab.id !== "imagenes" || canViewImages).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-5 py-3 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "text-[#09268E] border-[#09268E]"
                  : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto py-6 px-8 xl:px-12 space-y-4">
        {activeTab === "informacion" && <BabyInfoCard bebe={bebe} />}

        {activeTab === "resumen" && (
          <EpisodeSummaryTab
            episodio={episodio}
            onGoToSignos={() => setActiveTab("signos")}
            onGoToMedication={() => setActiveTab("medicacion")}
            onGoToDiagnostics={() => setActiveTab("diagnosticos")}
            onGoToOrders={() => setActiveTab("ordenes")}
            onAssignDoctor={canAssignEpisodeDoctor ? (mode) => {
              setDoctorModalMode(mode);
              setShowDoctorModal(true);
            } : undefined}
          />
        )}

        {activeTab === "diagnosticos" && (
          <DiagnosticsTab episodio={episodio} canCreate={canCreateDiagnostics} />
        )}

        {activeTab === "medicacion" && (
          <MedicationTab
            episodioId={episodio.id}
            canCreate={canCreateMedication}
            canAdminister={canAdministerMedication}
            canChangeState={canChangeMedicationState}
          />
        )}

        {activeTab === "ordenes" && (
          <OrdersTab
            episodio={episodio}
            canCreate={canCreateOrders && episodio.estado === EpisodioEstado.EnCurso}
            canChangeState={canChangeOrderState}
          />
        )}

        {activeTab === "signos" && (
          <VitalSignsTab episodioId={episodio.id} pacienteId={bebe.pacienteId} canCreate={canCreateVitalSigns} />
        )}

        {activeTab === "evolucion" && (
          <ClinicalEvolutionTab episodioId={episodio.id} episodio={episodio} canCreate={canCreateClinicalEvolution} />
        )}

        {activeTab === "notas" && (
          <NursingNotesTab episodioId={episodio.id} episodio={episodio} canCreate={canCreateNursingNotes} />
        )}

        {activeTab === "imagenes" && canViewImages && (
          <MedicalImagesTab pacienteId={bebe.pacienteId} />
        )}
      </div>

      {/* ── Modal asignación médico (reutilizado de pacientes) ────────────────── */}
      <AssignEpisodeDoctorModal
        open={showDoctorModal}
        episodioId={episodio.id}
        mode={doctorModalMode}
        currentDoctorId={
          doctorModalMode === "principal"
            ? episodio.medicoPrincipalId
            : episodio.medicoActualId
        }
        currentDoctorName={
          doctorModalMode === "principal"
            ? episodio.medicoPrincipalNombre
            : episodio.medicoActualNombre
        }
        onClose={() => setShowDoctorModal(false)}
        onUpdated={(updated) => setEpisodio(updated)}
      />
    </div>
  );
}

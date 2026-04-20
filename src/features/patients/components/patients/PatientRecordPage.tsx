"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPatientById,
  getPatientContacts,
} from "@/features/patients/services/patientService";
import { getActiveEpisode } from "@/features/patients/services/episodeService";
import { PatientInfoCard } from "@/features/patients/components/patients/PatientInfoCard";
import { PatientAllergyCard } from "@/features/patients/components/patients/PatientAllergyCard";
import { CreateEpisodeModal } from "@/features/patients/components/episodes/CreateEpisodeModal";
import { EpisodeHistoryTab } from "@/features/patients/components/episodes/EpisodeHistoryTab";
import { EpisodeSummaryTab } from "@/features/patients/components/episodes/EpisodeSummaryTab";
import { FinalizeEpisodeModal } from "@/features/patients/components/episodes/FinalizeEpisodeModal";
import { DiagnosticsTab } from "@/features/patients/components/diagnostics/DiagnosticsTab";
import { VitalSignsTab } from "@/features/patients/components/vitalSigns/VitalSignsTab";
import { NursingNotesTab } from "@/features/patients/components/nursingNotes/NursingNotesTab";
import { MedicationTab } from "@/features/patients/components/medication/MedicationTab";
import { OrdersTab } from "@/features/patients/components/orders/OrdersTab";
import {
  type Paciente,
  type ContactoPaciente,
  type EpisodioHistorial,
  EpisodioEstado,
} from "@/features/patients/types";
import { ClinicalEvolutionTab } from "../clinicalEvolution/ClinicalEvolutionTab";
import { MedicalImagesTab } from "../medicalImages/MedicalImagesTab";

//  Tabs de de la ficha del paciente. 
// Algunos solo se muestran si hay un episodio activo, otros siempre están disponibles pero muestran diferente contenido según el estado del episodio.

type NoEpisodeTab = "informacion" | "historial";
type ActiveEpisodeTab =
  | "informacion"
  | "resumen"
  | "diagnosticos"
  | "medicacion"
  | "ordenes"
  | "signos"
  | "evolucion"
  | "notas"
  | "imagenes";

const NO_EPISODE_TABS: { id: NoEpisodeTab; label: string }[] = [
  { id: "informacion", label: "Información" },
  { id: "historial", label: "Historial médico" },
];

const ACTIVE_EPISODE_TABS: { id: ActiveEpisodeTab; label: string }[] = [
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

// Funcion para calcular la edad a partir de la fecha de nacimiento. Se muestra en la cabecera de la ficha del paciente.

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}





interface PatientRecordPageProps {
  id: number;
}

// Componente principal de la ficha del paciente. 
// Muestra la información general del paciente, sus contactos, alergias, y si hay un episodio activo, 
// muestra las pestañas adicionales con el resumen, diagnósticos, medicación, órdenes, signos vitales, evolución clínica y notas de enfermería. 
// Permite iniciar un nuevo episodio o finalizar el episodio activo. Maneja la carga de datos y los estados de error.
export default function PatientRecordPage({ id }: PatientRecordPageProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [contacto, setContacto] = useState<ContactoPaciente | null>(null);
  const [episodioActivo, setEpisodioActivo] =
    useState<EpisodioHistorial | null>(null);

  const [activeTab, setActiveTab] = useState<NoEpisodeTab | ActiveEpisodeTab>(
    "informacion",
  );
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pac, contactos, episodio] = await Promise.all([
        getPatientById(id),
        getPatientContacts(id),
        getActiveEpisode(id),
      ]);
      setPaciente(pac);
      setContacto(contactos[0] ?? null);
      setEpisodioActivo(episodio);
      setActiveTab(episodio ? "resumen" : "informacion");
    } catch {
      setError("No se pudo cargar la ficha del paciente. Intente nuevamente.");
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

  if (error || !paciente) {
    return (
      <div className="py-6 px-8 xl:px-12">
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error ?? "No se encontró el paciente."}</span>
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => void loadData()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const edad = calcularEdad(paciente.fechaNacimiento);
  const tabs = episodioActivo ? ACTIVE_EPISODE_TABS : NO_EPISODE_TABS;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Static header + tab bar (solo scrollea el contenido) */}
      <div className="shrink-0 sticky top-0 z-10 bg-white">
        {/* Sub-header */}
        <div className="border-b border-[#e2e8f0] px-8 xl:px-12 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: back + patient name */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/patients")}
                className="btn btn-sm btn-ghost btn-circle text-[#64748b] hover:text-[#1A2B5E]"
                title="Volver a gestión de pacientes"
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
                  {paciente.apellidos}, {paciente.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5 font-mono">
                    {paciente.cedula}
                  </span>
                  <span className="text-[11px] font-medium text-[#64748b] bg-[#f1f5f9] rounded px-1.5 py-0.5">
                    {edad} años
                  </span>
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2">
              {episodioActivo ? (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline border-[#09268E] text-[#09268E] hover:bg-[#09268E] hover:text-white"
                    onClick={() => router.push(`/patients/${id}/historial`)}
                  >
                    Ver historial
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm text-white"
                    style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
                    onClick={() => setShowFinalizeModal(true)}
                  >
                    Finalizar atención
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn text-white"
                  style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                  onClick={() => setShowEpisodeModal(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="size-[1.2em]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Iniciar atención
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-[#D1D9E6] px-8 xl:px-12 overflow-x-auto">
          {tabs.map((tab) => (
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

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-6 px-8 xl:px-12 space-y-4">
        {activeTab === "informacion" && (
          <>
            <div className="space-y-4">
              <PatientInfoCard
                paciente={paciente}
                onUpdated={setPaciente}
                contacto={contacto}
                onContactUpdated={setContacto}
                onAccountCreated={() => void loadData()}
              />
              <PatientAllergyCard pacienteId={id} />
            </div>
          </>
        )}

        {activeTab === "resumen" && episodioActivo && (
          <EpisodeSummaryTab
            episodio={episodioActivo}
            onGoToSignos={() => setActiveTab("signos")}
            onGoToMedication={() => setActiveTab("medicacion")}
            onGoToDiagnostics={() => setActiveTab("diagnosticos")}
            onGoToOrders={() => setActiveTab("ordenes")}
          />
        )}

        {activeTab === "historial" && !episodioActivo && (
          <EpisodeHistoryTab pacienteId={id} />
        )}

        {activeTab === "diagnosticos" && episodioActivo && (
          <DiagnosticsTab episodio={episodioActivo} />
        )}
        {activeTab === "medicacion" && episodioActivo && (
          <MedicationTab episodioId={episodioActivo.id} />
        )}
        {activeTab === "ordenes" && episodioActivo && (
          <OrdersTab
            episodio={episodioActivo}
            canCreate={episodioActivo.estado === EpisodioEstado.EnCurso}
          />
        )}
        {activeTab === "signos" && episodioActivo && (
          <VitalSignsTab episodioId={episodioActivo.id} pacienteId={id} />
        )}
        {activeTab === "evolucion" && (
          <ClinicalEvolutionTab
            episodioId={episodioActivo!.id}
            episodio={episodioActivo!}
          />
        )}
        {activeTab === "notas" && episodioActivo && (
          <NursingNotesTab
            episodioId={episodioActivo!.id}
            episodio={episodioActivo!}
          />
        )}
        {activeTab === "imagenes" && episodioActivo && (
          <MedicalImagesTab pacienteId={id} />
        )}
      </div>

      {/* Modals */}
      <CreateEpisodeModal
        open={showEpisodeModal}
        onClose={() => setShowEpisodeModal(false)}
        onCreated={() => void loadData()}
        initialPacienteId={paciente.id}
        initialPacienteName={`${paciente.nombre} ${paciente.apellidos}`}
      />

      <FinalizeEpisodeModal
        open={showFinalizeModal}
        episodio={episodioActivo}
        onClose={() => setShowFinalizeModal(false)}
        onFinalizado={() => void loadData()}
      />
    </div>
  );
}

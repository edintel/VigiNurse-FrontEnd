"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHasPermission } from "@/lib/hasPermission";
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
import { AssignEpisodeDoctorModal } from "@/features/patients/components/episodes/AssignEpisodeDoctorModal";
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
import { BabyInfoCard } from "@/features/baby-monitoring/components/BabyInfoCard";
import { BabyFeedingTab } from "@/features/baby-monitoring/components/BabyFeedingTab";
import { BabyCareTab } from "@/features/baby-monitoring/components/BabyCareTab";
import { BabyLocationTab } from "@/features/baby-monitoring/components/BabyLocationTab";
import { DarDeAltaBebeModal } from "@/features/baby-monitoring/components/DarDeAltaBebeModal";
import { getBabyById } from "@/features/baby-monitoring/services/babyService";
import type { Bebe } from "@/features/baby-monitoring/types";

type NoEpisodeTab = "informacion" | "historial";
type ActiveEpisodeTab =
  | "informacion"
  | "resumen"
  | "alimentacion"
  | "cuidados"
  | "ubicacion"
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

const BASE_ACTIVE_TABS: { id: ActiveEpisodeTab; label: string }[] = [
  { id: "informacion", label: "Información" },
  { id: "resumen", label: "Resumen" },
];

const BABY_ONLY_TABS: { id: ActiveEpisodeTab; label: string }[] = [
  { id: "alimentacion", label: "Alimentación" },
  { id: "cuidados", label: "Cuidados" },
  { id: "ubicacion", label: "Ubicación" },
];

const CLINICAL_TABS: { id: ActiveEpisodeTab; label: string }[] = [
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
  bebeId?: number;
}

// Componente principal de la ficha del paciente. 
// Muestra la información general del paciente, sus contactos, alergias, y si hay un episodio activo, 
// muestra las pestañas adicionales con el resumen, diagnósticos, medicación, órdenes, signos vitales, evolución clínica y notas de enfermería. 
// Permite iniciar un nuevo episodio o finalizar el episodio activo. Maneja la carga de datos y los estados de error.
export default function PatientRecordPage({ id, bebeId }: PatientRecordPageProps) {
  const router = useRouter();
  const canEditPatient = useHasPermission("patients.edit");
  const canManageContact = useHasPermission("patients.contactManage");
  const canManageAllergies = useHasPermission("patients.allergiesManage");
  const canViewEpisodes = useHasPermission("patients.episodesView");
  const canCreateEpisode = useHasPermission("patients.episodesCreate");
  const canFinalizeEpisode = useHasPermission("patients.episodesFinalize");
  const canAssignEpisodeDoctor = useHasPermission("patients.episodesAssignDoctor");
  const canCreateDiagnostics = useHasPermission("patients.diagnosticsCreate");
  const canCreateClinicalEvolution = useHasPermission("patients.clinicalEvolutionCreate");
  const canCreateMedication = useHasPermission("patients.medicationCreate");
  const canAdministerMedication = useHasPermission("patients.medicationAdminister");
  const canChangeMedicationState = useHasPermission("patients.medicationChangeState");
  const canCreateOrders = useHasPermission("patients.ordersCreate");
  const canChangeOrderState = useHasPermission("patients.ordersChangeState");
  const canCreateVitalSigns = useHasPermission("patients.vitalSignsCreate");
  const canCreateNursingNotes = useHasPermission("patients.nursingNotesCreate");
  const canViewMedicalImages = useHasPermission("patients.medicalImagesView");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [contacto, setContacto] = useState<ContactoPaciente | null>(null);
  const [episodioActivo, setEpisodioActivo] =
    useState<EpisodioHistorial | null>(null);
  const [bebe, setBebe] = useState<Bebe | null>(null);

  const [activeTab, setActiveTab] = useState<NoEpisodeTab | ActiveEpisodeTab>(
    "informacion",
  );
  const [clinicalTabsOpen, setClinicalTabsOpen] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showBebeDischargeModal, setShowBebeDischargeModal] = useState(false);
  const [doctorModalMode, setDoctorModalMode] = useState<"principal" | "actual">("principal");
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pac, contactos, episodio, bebeData] = await Promise.all([
        getPatientById(id),
        getPatientContacts(id),
        canViewEpisodes ? getActiveEpisode(id).catch(() => null) : Promise.resolve(null),
        bebeId ? getBabyById(bebeId) : Promise.resolve(null),
      ]);
      setPaciente(pac);
      setContacto(contactos[0] ?? null);
      setEpisodioActivo(episodio);
      setBebe(bebeData);
      setActiveTab(episodio ? "resumen" : "informacion");
    } catch {
      setError("No se pudo cargar la ficha del paciente. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [id, bebeId, canViewEpisodes]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!canViewMedicalImages && activeTab === "imagenes") {
      setActiveTab(episodioActivo ? "resumen" : "informacion");
    }
  }, [activeTab, canViewMedicalImages, episodioActivo]);

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
  const isBabyActive = !!(bebe && bebe.activo && episodioActivo);
  const noEpisodeTabs = canViewEpisodes
    ? NO_EPISODE_TABS
    : NO_EPISODE_TABS.filter((tab) => tab.id === "informacion");
  const clinicalTabs = canViewMedicalImages
    ? CLINICAL_TABS
    : CLINICAL_TABS.filter((tab) => tab.id !== "imagenes");

  function TabBtn({ id, label }: { id: NoEpisodeTab | ActiveEpisodeTab; label: string }) {
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        className={[
          "px-5 py-3 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap",
          activeTab === id
            ? "text-[#09268E] border-[#09268E]"
            : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
        ].join(" ")}
      >
        {label}
      </button>
    );
  }

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
                    {bebe ? "Recién nacido" : `${edad} años`}
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
                  {bebe ? (
                    bebe.activo && (
                      canFinalizeEpisode && (
                        <button
                          type="button"
                          className="btn btn-sm text-white"
                          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                          onClick={() => setShowBebeDischargeModal(true)}
                        >
                          Dar de alta
                        </button>
                      )
                    )
                  ) : (
                    canFinalizeEpisode && (
                      <button
                        type="button"
                        className="btn btn-sm text-white"
                        style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
                        onClick={() => setShowFinalizeModal(true)}
                      >
                        Finalizar atención
                      </button>
                    )
                  )}
                </>
              ) : (
                !bebe && canCreateEpisode && (
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
                )
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-[#D1D9E6] px-8 xl:px-12 overflow-x-auto">
          {!episodioActivo ? (
            // Sin episodio activo: Información + Historial
            noEpisodeTabs.map((t) => <TabBtn key={t.id} id={t.id} label={t.label} />)
          ) : isBabyActive ? (
            // Bebé activo: tabs fijas + baby + flecha colapsable + tabs clínicas
            <>
              {BASE_ACTIVE_TABS.map((t) => <TabBtn key={t.id} id={t.id} label={t.label} />)}
              {BABY_ONLY_TABS.map((t) => <TabBtn key={t.id} id={t.id} label={t.label} />)}
              {/* Separador + botón colapsable */}
              <div className="flex items-center self-stretch px-1">
                <div className="w-px h-4 bg-[#D1D9E6] mx-1" />
              </div>
              <button
                type="button"
                title={clinicalTabsOpen ? "Ocultar tabs clínicas" : "Ver tabs clínicas"}
                onClick={() => {
                  if (clinicalTabsOpen && clinicalTabs.some(t => t.id === activeTab)) {
                    setActiveTab("resumen");
                  }
                  setClinicalTabsOpen(!clinicalTabsOpen);
                }}
                className={[
                  "flex items-center gap-1 px-3 py-3 text-xs font-semibold transition-all -mb-px border-b-2 whitespace-nowrap rounded-t",
                  clinicalTabsOpen
                    ? "text-[#09268E] border-[#09268E] bg-[#f0f4ff]"
                    : "text-slate-400 border-transparent hover:text-[#1A2B5E] hover:bg-slate-50",
                ].join(" ")}
              >
                <span className="hidden sm:inline">{clinicalTabsOpen ? "Clínico" : "Clínico"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className={`size-3.5 transition-transform duration-300 ${clinicalTabsOpen ? "rotate-180" : "rotate-0"}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {/* Tabs clínicas colapsables con animación horizontal */}
              <div
                className={`flex items-center gap-0 overflow-hidden transition-all duration-300 ease-in-out ${
                  clinicalTabsOpen ? "max-w-[900px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
                }`}
              >
                {clinicalTabs.map((t) => <TabBtn key={t.id} id={t.id} label={t.label} />)}
              </div>
            </>
          ) : (
            // Paciente normal con episodio activo: todas las tabs clínicas
            <>
              {BASE_ACTIVE_TABS.map((t) => <TabBtn key={t.id} id={t.id} label={t.label} />)}
              {clinicalTabs.map((t) => <TabBtn key={t.id} id={t.id} label={t.label} />)}
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto py-6 px-8 xl:px-12 space-y-4">
        {activeTab === "informacion" && (
          <>
            {bebe ? (
              <BabyInfoCard bebe={bebe} />
            ) : (
              <div className="space-y-4">
                <PatientInfoCard
                  paciente={paciente}
                  onUpdated={setPaciente}
                  contacto={contacto}
                  onContactUpdated={setContacto}
                  onAccountCreated={() => void loadData()}
                  canEditPatient={canEditPatient}
                  canManageContact={canManageContact}
                  canCreatePatientAccount={canManageContact}
                />
                <PatientAllergyCard pacienteId={id} canManage={canManageAllergies} />
              </div>
            )}
          </>
        )}

        {activeTab === "resumen" && episodioActivo && (
          <EpisodeSummaryTab
            episodio={episodioActivo}
            onGoToSignos={() => setActiveTab("signos")}
            onGoToMedication={() => setActiveTab("medicacion")}
            onGoToDiagnostics={() => setActiveTab("diagnosticos")}
            onGoToOrders={() => setActiveTab("ordenes")}
            onAssignDoctor={canAssignEpisodeDoctor ? (mode) => { setDoctorModalMode(mode); setShowDoctorModal(true); } : undefined}
          />
        )}

        {activeTab === "historial" && !episodioActivo && canViewEpisodes && (
          <EpisodeHistoryTab pacienteId={id} bebeId={bebe?.id} />
        )}

        {activeTab === "alimentacion" && isBabyActive && (
          <BabyFeedingTab episodioId={bebe!.episodioId} readOnly={false} />
        )}
        {activeTab === "cuidados" && isBabyActive && (
          <BabyCareTab episodioId={bebe!.episodioId} readOnly={false} />
        )}

        {activeTab === "ubicacion" && isBabyActive && (
          <BabyLocationTab bebe={bebe!} readOnly={false} />
        )}

        {activeTab === "diagnosticos" && episodioActivo && (
          <DiagnosticsTab episodio={episodioActivo} canCreate={canCreateDiagnostics} />
        )}
        {activeTab === "medicacion" && episodioActivo && (
          <MedicationTab
            episodioId={episodioActivo.id}
            canCreate={canCreateMedication}
            canAdminister={canAdministerMedication}
            canChangeState={canChangeMedicationState}
          />
        )}
        {activeTab === "ordenes" && episodioActivo && (
          <OrdersTab
            episodio={episodioActivo}
            canCreate={canCreateOrders && episodioActivo.estado === EpisodioEstado.EnCurso}
            canChangeState={canChangeOrderState}
          />
        )}
        {activeTab === "signos" && episodioActivo && (
          <VitalSignsTab episodioId={episodioActivo.id} pacienteId={id} canCreate={canCreateVitalSigns} />
        )}
        {activeTab === "evolucion" && (
          <ClinicalEvolutionTab
            episodioId={episodioActivo!.id}
            episodio={episodioActivo!}
            canCreate={canCreateClinicalEvolution}
          />
        )}
        {activeTab === "notas" && episodioActivo && (
          <NursingNotesTab
            episodioId={episodioActivo!.id}
            episodio={episodioActivo!}
            canCreate={canCreateNursingNotes}
          />
        )}
        {activeTab === "imagenes" && episodioActivo && canViewMedicalImages && (
          <MedicalImagesTab pacienteId={id} />
        )}
      </div>

      {/* Modals */}
      {canCreateEpisode && (
        <CreateEpisodeModal
          open={showEpisodeModal}
          onClose={() => setShowEpisodeModal(false)}
          onCreated={() => void loadData()}
          initialPacienteId={paciente.id}
          initialPacienteName={`${paciente.nombre} ${paciente.apellidos}`}
        />
      )}

      {canFinalizeEpisode && (
        <FinalizeEpisodeModal
          open={showFinalizeModal}
          episodio={episodioActivo}
          onClose={() => setShowFinalizeModal(false)}
          onFinalizado={() => void loadData()}
        />
      )}

      {canFinalizeEpisode && bebe && episodioActivo && (
        <DarDeAltaBebeModal
          open={showBebeDischargeModal}
          bebe={bebe}
          episodio={episodioActivo}
          onClose={() => setShowBebeDischargeModal(false)}
          onDadoDeAlta={() => void loadData()}
        />
      )}

      {canAssignEpisodeDoctor && episodioActivo && (
        <AssignEpisodeDoctorModal
          open={showDoctorModal}
          episodioId={episodioActivo.id}
          mode={doctorModalMode}
          currentDoctorId={doctorModalMode === "principal" ? episodioActivo.medicoPrincipalId : episodioActivo.medicoActualId}
          currentDoctorName={doctorModalMode === "principal" ? episodioActivo.medicoPrincipalNombre : episodioActivo.medicoActualNombre}
          onClose={() => setShowDoctorModal(false)}
          onUpdated={(updated) => setEpisodioActivo(updated)}
        />
      )}
    </div>
  );
}

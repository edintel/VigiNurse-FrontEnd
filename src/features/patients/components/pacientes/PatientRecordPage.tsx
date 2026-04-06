"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPacienteById,
  getContactosPaciente,
} from "@/features/patients/services/patientService";
import { getEpisodioActivo } from "@/features/patients/services/episodioService";
import { PatientInfoCard } from "@/features/patients/components/pacientes/PatientInfoCard";
import { PatientAllergyCard } from "@/features/patients/components/pacientes/PatientAllergyCard";
import { CreateEpisodioModal } from "@/features/patients/components/episodios/CreateEpisodioModal";
import { EpisodioHistorialTab } from "@/features/patients/components/episodios/EpisodioHistorialTab";
import { EpisodioResumenTab } from "@/features/patients/components/episodios/EpisodioResumenTab";
import { FinalizarEpisodioModal } from "@/features/patients/components/episodios/FinalizarEpisodioModal";
import { DiagnosticosTab } from "@/features/patients/components/diagnosticos/DiagnosticosTab";
import { SignosVitalesTab } from "@/features/patients/components/signosVitales/SignosVitalesTab";
import { NotasEnfermeriaTab } from "@/features/patients/components/notas/NotasEnfermeriaTab";
import { MedicacionTab } from "@/features/patients/components/medicacion/MedicacionTab";
import { OrdenesTab } from "@/features/patients/components/ordenes/OrdenesTab";
import {
  type Paciente,
  type ContactoPaciente,
  type EpisodioHistorial,
  EpisodioEstado,
} from "@/features/patients/types";
import { EvolucionClinicaTab } from "../evolucion/EvolucionClinicaTab";

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
  | "notas";

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
  const [showEpisodioModal, setShowEpisodioModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pac, contactos, episodio] = await Promise.all([
        getPacienteById(id),
        getContactosPaciente(id),
        getEpisodioActivo(id),
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
                    onClick={() => setShowFinalizarModal(true)}
                  >
                    Finalizar atención
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn text-white"
                  style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                  onClick={() => setShowEpisodioModal(true)}
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
              />
              <PatientAllergyCard pacienteId={id} />
            </div>
          </>
        )}

        {activeTab === "resumen" && episodioActivo && (
          <EpisodioResumenTab
            episodio={episodioActivo}
            onGoToSignos={() => setActiveTab("signos")}
            onGoToMedicacion={() => setActiveTab("medicacion")}
            onGoToDiagnosticos={() => setActiveTab("diagnosticos")}
            onGoToOrdenes={() => setActiveTab("ordenes")}
          />
        )}

        {activeTab === "historial" && !episodioActivo && (
          <EpisodioHistorialTab pacienteId={id} />
        )}

        {activeTab === "diagnosticos" && episodioActivo && (
          <DiagnosticosTab episodio={episodioActivo} />
        )}
        {activeTab === "medicacion" && episodioActivo && (
          <MedicacionTab episodioId={episodioActivo.id} />
        )}
        {activeTab === "ordenes" && episodioActivo && (
          <OrdenesTab
            episodio={episodioActivo}
            canCreate={episodioActivo.estado === EpisodioEstado.EnCurso}
          />
        )}
        {activeTab === "signos" && episodioActivo && (
          <SignosVitalesTab episodioId={episodioActivo.id} />
        )}
        {activeTab === "evolucion" && (
          <EvolucionClinicaTab
            episodioId={episodioActivo!.id}
            episodio={episodioActivo!}
          />
        )}
        {activeTab === "notas" && episodioActivo && (
          <NotasEnfermeriaTab
            episodioId={episodioActivo!.id}
            episodio={episodioActivo!}
          />
        )}
      </div>

      {/* Modals */}
      <CreateEpisodioModal
        open={showEpisodioModal}
        onClose={() => setShowEpisodioModal(false)}
        onCreated={() => void loadData()}
        initialPacienteId={paciente.id}
        initialPacienteName={`${paciente.nombre} ${paciente.apellidos}`}
      />

      <FinalizarEpisodioModal
        open={showFinalizarModal}
        episodio={episodioActivo}
        onClose={() => setShowFinalizarModal(false)}
        onFinalizado={() => void loadData()}
      />
    </div>
  );
}

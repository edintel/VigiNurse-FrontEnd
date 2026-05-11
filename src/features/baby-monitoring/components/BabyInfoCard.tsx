"use client";
import { useRouter } from "next/navigation";
import { PatientAllergyCard } from "@/features/patients/components/patients/PatientAllergyCard";
import type { Bebe } from "@/features/baby-monitoring/types";
import type React from "react";

interface BabyInfoCardProps {
  bebe: Bebe;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DataField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-[#0f172a] font-medium">{value}</span>
    </div>
  );
}

function ApgarBadge({ score }: { score: number }) {
  const cls =
    score >= 7
      ? "bg-green-50 border-green-200 text-green-700"
      : score >= 4
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-red-50 border-red-200 text-red-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}>
      {score} / 10
    </span>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-1 ${highlight ? "bg-[#F0F4FF] border-[#C7D3F5]" : "bg-[#F8FAFC] border-[#E2E8F0]"}`}
    >
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-lg font-bold text-[#1A2B5E] leading-none">
        {value}
        {suffix && (
          <span className="text-xs font-medium text-slate-400 ml-1">{suffix}</span>
        )}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
      {children}
    </h3>
  );
}

// Componente para mostrar la información detallada de un bebé, incluyendo datos personales, 
// métricas neonatales, información de alta y datos de la madre (si aplica).
export function BabyInfoCard({ bebe }: BabyInfoCardProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* ── Datos del bebé ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#1A2B5E]">
            Datos del recién nacido
          </h2>
          
        </div>

        {/* Card body */}
        <div className="px-6 py-5 space-y-6">
          {/* Identificación */}
          <div>
            <SectionTitle>Identificación</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <DataField
                label="Nombre completo"
                value={`${bebe.apellidos}, ${bebe.nombre}`}
              />
              <DataField label="Sexo" value={bebe.sexo} />
              <DataField
                label="Tipo de sangre"
                value={bebe.tipoSangre ?? <span className="text-slate-400 italic">No registrado</span>}
              />
              <DataField
                label="Fecha de nacimiento"
                value={formatDate(bebe.fechaNacimiento)}
              />
              <DataField
                label="Hora de nacimiento"
                value={formatTime(bebe.fechaNacimiento)}
              />
              <DataField
                label="Fecha de registro"
                value={formatDate(bebe.fechaRegistro)}
              />
            </div>
          </div>

          {/* Métricas neonatales */}
          <div>
            <SectionTitle>Métricas neonatales</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="APGAR"
                value={<ApgarBadge score={bebe.puntuacionApgar} />}
                highlight
              />
              <MetricCard
                label="Peso al nacer"
                value={bebe.peso.toLocaleString("es-ES")}
                suffix="g"
                highlight
              />
              <MetricCard
                label="Longitud"
                value={bebe.tamano}
                suffix="cm"
                highlight
              />
              <MetricCard
                label="Semanas gestación"
                value={bebe.semanasGestacion}
                suffix="sem."
                highlight
              />
            </div>
          </div>

          {/* Alta (solo si fue dado de alta) */}
          {(!bebe.activo || bebe.fechaAlta) && (
            <div>
              <SectionTitle>Información de alta</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {bebe.fechaAlta && (
                  <DataField
                    label="Fecha de alta"
                    value={formatDate(bebe.fechaAlta)}
                  />
                )}
                {bebe.dadoDeAltaPorNombre && (
                  <DataField
                    label="Dado de alta por"
                    value={bebe.dadoDeAltaPorNombre}
                  />
                )}
              </div>
            </div>
          )}

          {/* Madre */}
          {bebe.madreId && (
            <div>
              <SectionTitle>Madre</SectionTitle>
              <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="#ec4899"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">
                      {bebe.apellidosMadre}, {bebe.nombreMadre}
                    </p>
                    <p className="text-xs text-slate-400">
                      Paciente #{bebe.madreId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-[#09268E]"
                  onClick={() => router.push(`/patients/${bebe.madreId}`)}
                >
                  Ver ficha
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
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Alergias ──────────────────────────────────────────────────────────── */}
      <PatientAllergyCard pacienteId={bebe.pacienteId} />
    </div>
  );
}

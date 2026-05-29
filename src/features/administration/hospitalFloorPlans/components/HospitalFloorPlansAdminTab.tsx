"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser, selectCurrentRole, selectAuthToken } from "@/store/slices/authSlice";

// Funcion para extraer el hospitalId de un JWT, 
// asumiendo que el token tiene un campo "hospital_id" en su payload. Devuelve null si no se puede extraer un número válido.
function hospitalIdFromJwt(token: string): number | null {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const raw = payload["hospital_id"];
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") return parseInt(raw, 10) || null;
    return null;
  } catch {
    return null;
  }
}

const ConfigureFloorPlansTab = dynamic(
  () => import("@/features/administration/hospitalFloorPlans/components/tabs/ConfigureFloorPlansTab"),
  { ssr: false }
);

// Componente principal para la pestaña de administración de planos de planta del hospital. 
// Maneja la lógica de selección de hospital para SuperAdmin y 
// muestra el componente de configuración de planos para el hospital seleccionado.
export default function HospitalFloorPlansAdminTab() {
  const currentUser = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const role = useAppSelector(selectCurrentRole);
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [superAdminHospitalId, setSuperAdminHospitalId] = useState("");
  const [confirmedHospitalId, setConfirmedHospitalId] = useState<number | null>(null);

  const hospitalId = useMemo(() => {
    if (isSuperAdmin) return confirmedHospitalId;
    return currentUser?.hospitalId ?? (token ? hospitalIdFromJwt(token) : null);
  }, [isSuperAdmin, confirmedHospitalId, currentUser?.hospitalId, token]);

  if (isSuperAdmin && confirmedHospitalId === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#EBF0FF] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1A2B5E]">Selecciona un hospital</p>
          <p className="text-xs text-slate-400 mt-1">Como SuperAdmin indica el ID del hospital que deseas gestionar.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="ID del hospital"
            value={superAdminHospitalId}
            onChange={(e) => setSuperAdminHospitalId(e.target.value)}
            className="input input-bordered input-sm w-40 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const n = parseInt(superAdminHospitalId, 10);
                if (!isNaN(n) && n > 0) setConfirmedHospitalId(n);
              }
            }}
          />
          <button
            className="btn btn-sm text-white"
            style={{ backgroundColor: "#09268E" }}
            onClick={() => {
              const n = parseInt(superAdminHospitalId, 10);
              if (!isNaN(n) && n > 0) setConfirmedHospitalId(n);
            }}
          >
            Ver planos
          </button>
        </div>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-slate-500">No tienes un hospital asignado en tu cuenta.</p>
      </div>
    );
  }

  return <ConfigureFloorPlansTab hospitalId={hospitalId} isSuperAdmin={isSuperAdmin} />;
}

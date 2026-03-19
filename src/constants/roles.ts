import type { AuthRole } from "@/types";
export const ROLES: Record<AuthRole, string> = {
    SUPER_ADMIN: "Super Administrador",
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    ENFERMERO: "Enfermero",
    TECNICO: "Técnico",
    GESTOR: "Gestor",
    DOCTOR: "Doctor",
    PACIENTE: "Paciente",
} as const;

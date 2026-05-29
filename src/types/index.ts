export type AuthRole = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "ENFERMERO" | "TECNICO" | "GESTOR" | "DOCTOR" | "RECEPCIONISTA" | "AUDITOR" | "PACIENTE";
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: AuthRole;
    hospitalId?: number | null;
}
export interface PersistedSession {
    token: string;
    user: AuthUser;
    permissions: string[];
    expiracion?: string;
}

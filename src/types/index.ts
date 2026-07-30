export type AuthRole = "SUPER_ADMIN" | "ADMIN" | "SUPERVISOR" | "ENFERMERO" | "TECNICO" | "GESTOR" | "DOCTOR" | "RECEPCIONISTA" | "AUDITOR" | "PACIENTE";
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: AuthRole;
    hospitalId?: number | null;
}
// Sesion persistida en el navegador. NO contiene el JWT: el token vive en una cookie
// httpOnly que el JavaScript no puede leer, por lo que un XSS no puede robar la sesion.
// Aqui solo se guarda el perfil no sensible para poder rehidratar la UI al recargar.
export interface PersistedSession {
    user: AuthUser;
    permissions: string[];
    expiracion?: string;
}

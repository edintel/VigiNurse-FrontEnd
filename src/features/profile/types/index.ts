export interface UserProfile {
    id: number;
    email: string;
    nombre: string;
    apellidos: string;
    nombreEspecialidad?: string | null;
    roles: string[];
    fechaCreacion: string;
    especialidadId?: number | null;
}
export interface ChangePasswordPayload {
    passwordActual: string;
    passwordNuevo: string;
    confirmacionPassword: string;
}
export type ChangePasswordResult = {
    success: true;
} | {
    success: false;
    error: string;
};

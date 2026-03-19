export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.100.7:5025/api";
export const API_ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/auth/login`,
        changePassword: `${API_BASE_URL}/auth/cambiar-password`,
        requestRecovery: `${API_BASE_URL}/auth/solicitar-recuperacion`,
        validateToken: `${API_BASE_URL}/auth/validar-token`,
        resetPassword: `${API_BASE_URL}/auth/restablecer-password`,
    },
    roles: {
        list: `${API_BASE_URL}/roles`,
    },
    specialties: {
        list: `${API_BASE_URL}/especialidades`,
    },
    especialidades: {
        list: `${API_BASE_URL}/especialidades`,
        byId: (id: number) => `${API_BASE_URL}/especialidades/${id}`,
    },
    users: {
        me: (id: number | string) => `${API_BASE_URL}/usuarios/${id}`,
    },
    admin: {
        users: `${API_BASE_URL}/usuarios`,
        user: (id: number) => `${API_BASE_URL}/usuarios/${id}`,
        block: (id: number) => `${API_BASE_URL}/usuarios/${id}/bloquear`,
        unblock: (id: number) => `${API_BASE_URL}/usuarios/${id}/desbloquear`,
    },
    audit: {
        logs: `${API_BASE_URL}/auditoria`,
        byUser: (usuarioId: number) => `${API_BASE_URL}/auditoria/usuario/${usuarioId}`,
    },
    hospitals: {
        list: `${API_BASE_URL}/hospitales`,
        byId: (id: number) => `${API_BASE_URL}/hospitales/${id}`,
    },
    areas: {
        list: `${API_BASE_URL}/areas`,
        byId: (id: number) => `${API_BASE_URL}/areas/${id}`,
    },
} as const;

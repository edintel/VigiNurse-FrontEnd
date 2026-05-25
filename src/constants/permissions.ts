import type { AuthRole } from "@/types";
export const PERMISSIONS = {
    especialidades: {
        view: ["ADMIN"] as AuthRole[],
        create: ["ADMIN"] as AuthRole[],
        edit: ["ADMIN"] as AuthRole[],
    },
    areas: {
        view: ["ADMIN"] as AuthRole[],
        create: ["ADMIN"] as AuthRole[],
        edit: ["ADMIN"] as AuthRole[],
        delete: ["ADMIN"] as AuthRole[],
    },
    tiposActivos: {
        view: ["ADMIN"] as AuthRole[],
        create: ["ADMIN"] as AuthRole[],
        edit: ["ADMIN"] as AuthRole[],
    },
    zonas: {
        view: ["ADMIN"] as AuthRole[],
        create: ["ADMIN"] as AuthRole[],
        edit: ["ADMIN"] as AuthRole[],
        delete: ["ADMIN"] as AuthRole[],
    },
    users: {
        view: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
        create: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
        edit: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
        deactivate: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
    },
    settings: {
        view: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
        edit: ["SUPER_ADMIN"] as AuthRole[],
    },
    patients: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR", "RECEPCIONISTA"] as AuthRole[],
        create: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "RECEPCIONISTA"] as AuthRole[],
        edit: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "RECEPCIONISTA"] as AuthRole[],
        delete: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
        contactManage: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "RECEPCIONISTA"] as AuthRole[],
        allergiesManage: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        episodesView: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        episodesCreate: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "RECEPCIONISTA"] as AuthRole[],
        episodesFinalize: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
        episodesAssignDoctor: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR"] as AuthRole[],
        diagnosticsCreate: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
        clinicalEvolutionCreate: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
        medicationCreate: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
        medicationAdminister: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO"] as AuthRole[],
        medicationChangeState: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        ordersCreate: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
        ordersChangeState: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        vitalSignsCreate: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        nursingNotesCreate: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO"] as AuthRole[],
        medicalImagesView: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
    },
    vitalsMonitoring: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        configure: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
    },
    nurseCalls: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO"] as AuthRole[],
        manage: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR"] as AuthRole[],
    },
    assetsManagement: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "TECNICO"] as AuthRole[],
        manage: ["SUPER_ADMIN", "ADMIN", "TECNICO"] as AuthRole[],
    },
    medicalImaging: {
        view: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
        upload: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
    },
    staffMonitoring: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR"] as AuthRole[],
        manage: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
    },
    babyMonitoring: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR"] as AuthRole[],
        configure: ["SUPER_ADMIN", "ADMIN", "DOCTOR"] as AuthRole[],
    },
    notifications: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "ENFERMERO", "DOCTOR", "TECNICO", "GESTOR"] as AuthRole[],
        manage: ["SUPER_ADMIN", "ADMIN"] as AuthRole[],
    },
    reports: {
        view: ["SUPER_ADMIN", "ADMIN", "SUPERVISOR", "GESTOR"] as AuthRole[],
        export: ["SUPER_ADMIN", "ADMIN", "GESTOR"] as AuthRole[],
    },
    patientPortal: {
        view: ["SUPER_ADMIN", "ADMIN", "PACIENTE"] as AuthRole[],
    },
} as const satisfies Record<string, Record<string, AuthRole[]>>;

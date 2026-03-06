import type { Role } from "./roles";

export const PERMISSIONS = {
  patients: {
    view: ["admin", "nurse", "doctor", "supervisor"],
    create: ["admin", "doctor"],
    edit: ["admin", "doctor", "nurse"],
    delete: ["admin"],
  },
  vitalsMonitoring: {
    view: ["admin", "nurse", "doctor", "supervisor"],
    configure: ["admin", "doctor"],
  },
  nurseCalls: {
    view: ["admin", "nurse", "supervisor"],
    manage: ["admin", "supervisor"],
  },
  assetsManagement: {
    view: ["admin", "supervisor"],
    manage: ["admin"],
  },
  medicalImaging: {
    view: ["admin", "doctor", "supervisor"],
    upload: ["admin", "doctor"],
  },
  staffMonitoring: {
    view: ["admin", "supervisor"],
    manage: ["admin"],
  },
  babyMonitoring: {
    view: ["admin", "nurse", "doctor", "supervisor"],
    configure: ["admin", "doctor"],
  },
  notifications: {
    view: ["admin", "nurse", "doctor", "supervisor"],
    manage: ["admin"],
  },
} as const satisfies Record<string, Record<string, Role[]>>;

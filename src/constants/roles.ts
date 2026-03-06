export const ROLES = {
  ADMIN: "admin",
  NURSE: "nurse",
  DOCTOR: "doctor",
  SUPERVISOR: "supervisor",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

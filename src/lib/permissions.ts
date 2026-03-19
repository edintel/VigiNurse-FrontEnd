import type { AuthRole } from "@/types";
import { PERMISSIONS } from "@/constants/permissions";
// Ejecuta la logica para generar un array de permisos basado en el rol del usuario
export function generatePermissions(role: AuthRole): string[] {
  const perms: string[] = [];
  for (const [module, actions] of Object.entries(PERMISSIONS)) {
    for (const [action, allowedRoles] of Object.entries(actions)) {
      if ((allowedRoles as AuthRole[]).includes(role)) {
        perms.push(`${module}.${action}`);
      }
    }
  }
  return perms;
}

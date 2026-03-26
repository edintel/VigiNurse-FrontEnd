import { store } from "@/store/store";
import { useAppSelector } from "@/store/hooks";
import { selectPermissions } from "@/store/slices/authSlice";
// Valida permiso.
export function hasPermission(permissionKey: string): boolean {
  return store.getState().auth.permissions.includes(permissionKey);
}
// Gestiona estado y acciones para verificacion permiso.
export function useHasPermission(permissionKey: string): boolean {
  return useAppSelector((state) =>
    selectPermissions(state).includes(permissionKey),
  );
}

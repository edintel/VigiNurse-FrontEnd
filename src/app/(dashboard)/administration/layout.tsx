import { PermissionGuard } from "@/features/authentication/components/PermissionGuard";
// Muestra el componente de administracion layout.
export default function AdministracionLayout({ children, }: {
    children: React.ReactNode;
}) {
    return <PermissionGuard permission="users.view">{children}</PermissionGuard>;
}

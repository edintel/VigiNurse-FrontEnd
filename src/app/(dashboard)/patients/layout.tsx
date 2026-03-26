import { PermissionGuard } from "@/features/authentication/components/PermissionGuard";
// Muestra el componente de patients layout.
export default function PatientsLayout({ children, }: {
    children: React.ReactNode;
}) {
    return (<PermissionGuard permission="patients.view">{children}</PermissionGuard>);
}

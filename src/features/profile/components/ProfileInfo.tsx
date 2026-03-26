import type { UserProfile } from "@/features/profile/types";
import { ROLES } from "@/constants/roles";
interface ProfileInfoProps {
  profile: UserProfile;
}
// Da formato a la fecha.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
// Da formato al rol.
function formatRole(role: string): string {
  return ROLES[role.trim().toUpperCase() as keyof typeof ROLES] ?? role;
}
interface FieldRowProps {
  label: string;
  value: string;
}
// Componente para mostrar una fila de información con etiqueta y valor.
function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-200 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:w-44 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}
// Componente principal para mostrar la información del perfil del usuario.
export function ProfileInfo({ profile }: ProfileInfoProps) {
  const currentRole =
    profile.roles.length > 0 ? formatRole(profile.roles[0]) : "Sin rol";
  return (
    <div className="card bg-white shadow-sm border border-slate-200">
      <div className="card-body gap-0 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xl font-bold shrink-0 select-none">
            {profile.nombre.charAt(0).toUpperCase()}
            {profile.apellidos.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="card-title text-slate-800 text-lg">
              {profile.nombre} {profile.apellidos}
            </h2>
            <p className="text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>

        <FieldRow label="Nombre" value={profile.nombre} />
        <FieldRow label="Apellidos" value={profile.apellidos} />
        <FieldRow label="Correo electrónico" value={profile.email} />
        <FieldRow label="Rol" value={currentRole} />
        <FieldRow
          label="Especialidad"
          value={profile.nombreEspecialidad ?? "No aplica"}
        />
        <FieldRow
          label="Fecha de ingreso al sistema"
          value={formatDate(profile.fechaCreacion)}
        />
      </div>
    </div>
  );
}

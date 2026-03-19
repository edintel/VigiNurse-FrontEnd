import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
    title: "Dashboard",
};
// Muestra la pagina de tablero home.
export default function DashboardHomePage() {
    return (<div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-800">Bienvenido al sistema</h1>
        <p className="mt-2 text-sm text-slate-600">
          Desde este panel puede acceder a los módulos clínicos y administrativos
          disponibles en VigiNurse.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado de acceso
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Sesión activa y lista para operar.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recomendación
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Verifique notificaciones y llamados pendientes al iniciar turno.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seguridad
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Mantenga actualizada su contraseña y no comparta credenciales.
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800">Accesos rápidos</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/usuarios" className="btn btn-sm" style={{ backgroundColor: "#09268E", borderColor: "#09268E", color: "#fff" }}>
            Gestión de usuarios
          </Link>
          <Link href="/perfil" className="btn btn-sm btn-outline border-slate-300 text-slate-700">
            Mi perfil
          </Link>
          <Link href="/nurse-calls" className="btn btn-sm btn-outline border-slate-300 text-slate-700">
            Llamados de enfermería
          </Link>
        </div>
      </section>
    </div>);
}

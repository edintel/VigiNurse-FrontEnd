"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { getUsuarioById } from "@/features/staff-monitoring/services/personalDetailService";
import { getActiveEpisodes } from "@/features/patients/services/episodeService";
import { getUsers } from "@/features/administration/users/services/userManagementService";
import { getPersonalMedico } from "@/features/staff-monitoring/services/personalMedicoService";
import { getTurnos } from "@/features/staff-monitoring/services/turnosService";
import { getAreas } from "@/features/staff-monitoring/services/areasService";
import { getBabies } from "@/features/baby-monitoring/services/babyService";
import { EstadoDisponibilidadPersonal } from "@/features/staff-monitoring/types";
import { TriageNivel, TRIAGE_CONFIG } from "@/features/patients/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayRange(): { fechaDesde: string; fechaHasta: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return { fechaDesde: `${date}T00:00:00`, fechaHasta: `${date}T23:59:59` };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "green" | "amber" | "red" | "slate" | "purple";
  icon: React.ReactNode;
}) {
  const accentMap = {
    blue: { bg: "bg-[#EBF0FF]", text: "text-[#09268E]" },
    green: { bg: "bg-green-50", text: "text-green-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    red: { bg: "bg-red-50", text: "text-red-600" },
    slate: { bg: "bg-slate-100", text: "text-slate-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-700" },
  };
  const { bg, text } = accentMap[accent ?? "slate"];
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <span className={text}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-[#1A2B5E] leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-[#1A2B5E]">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="text-xs font-semibold text-[#09268E] hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DashboardData {
  hospitalName: string;
  adminName: string;
  totalEpisodiosActivos: number;
  triageCounts: Record<TriageNivel, number>;
  totalUsuarios: number;
  bloqueados: number;
  disponibles: number;
  ocupados: number;
  enBreak: number;
  fueraDeServicio: number;
  totalAreas: number;
  totalTurnos: number;
  neonatosActivos: number;
}

export default function AdminHospitalDashboard() {
  const user = useAppSelector(selectCurrentUser);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPatients, setRecentPatients] = useState<
    { episodioId: number; nombre: string; apellidos: string; areaNombre: string; nivelTriage: TriageNivel; fechaAdmision: string }[]
  >([]);
  const [todayShifts, setTodayShifts] = useState<
    { id: number; nombreUsuario: string; apellidosUsuario: string; nombreArea: string; fechaInicio: string; fechaFin: string }[]
  >([]);
  const [areas, setAreas] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const userId = Number(user.id);

    async function load() {
      setLoading(true);
      const { fechaDesde, fechaHasta } = todayRange();

      const [
        staffDetail,
        episodiosRes,
        totalUsersRes,
        bloqueadosRes,
        disponiblesRes,
        ocupadosRes,
        enBreakRes,
        fueraDeServicioRes,
        turnosRes,
        areasRes,
        neonatosRes,
      ] = await Promise.allSettled([
        getUsuarioById(userId),
        getActiveEpisodes(1, 100),
        getUsers(1, 1),
        getUsers(1, 1, { bloqueado: true }),
        getPersonalMedico(1, 1, { estado: EstadoDisponibilidadPersonal.Disponible }),
        getPersonalMedico(1, 1, { estado: EstadoDisponibilidadPersonal.Ocupado }),
        getPersonalMedico(1, 1, { estado: EstadoDisponibilidadPersonal.EnBreak }),
        getPersonalMedico(1, 1, { estado: EstadoDisponibilidadPersonal.FueraDeServicio }),
        getTurnos(1, 500, { fechaDesde, fechaHasta }),
        getAreas(),
        getBabies(1, 1),
      ]);

      const detail = staffDetail.status === "fulfilled" ? staffDetail.value : null;
      const episodios = episodiosRes.status === "fulfilled" ? episodiosRes.value : null;
      const totalUsers = totalUsersRes.status === "fulfilled" ? totalUsersRes.value.totalRegistros : 0;
      const bloqueados = bloqueadosRes.status === "fulfilled" ? bloqueadosRes.value.totalRegistros : 0;
      const turnos = turnosRes.status === "fulfilled" ? turnosRes.value.datos : [];
      const areasData = areasRes.status === "fulfilled" ? areasRes.value : [];
      const neonatos = neonatosRes.status === "fulfilled" ? neonatosRes.value.totalRegistros : 0;

      const triageCounts: Record<TriageNivel, number> = {
        [TriageNivel.NoAplica]: 0,
        [TriageNivel.Reanimacion]: 0,
        [TriageNivel.Emergencia]: 0,
        [TriageNivel.Urgencia]: 0,
        [TriageNivel.Prioritario]: 0,
        [TriageNivel.NoUrgente]: 0,
      };
      episodios?.datos.forEach((e) => {
        const level = e.nivelTriage as TriageNivel;
        if (level in triageCounts) triageCounts[level]++;
      });

      const disponibles = disponiblesRes.status === "fulfilled" ? disponiblesRes.value.totalRegistros : 0;
      const ocupados = ocupadosRes.status === "fulfilled" ? ocupadosRes.value.totalRegistros : 0;
      const enBreak = enBreakRes.status === "fulfilled" ? enBreakRes.value.totalRegistros : 0;
      const fueraDeServicio =
        fueraDeServicioRes.status === "fulfilled" ? fueraDeServicioRes.value.totalRegistros : 0;

      setData({
        hospitalName: detail?.nombreHospital ?? "Hospital",
        adminName: detail ? `${detail.nombre} ${detail.apellidos}` : user?.name ?? "",
        totalEpisodiosActivos: episodios?.totalRegistros ?? 0,
        triageCounts,
        totalUsuarios: totalUsers,
        bloqueados,
        disponibles,
        ocupados,
        enBreak,
        fueraDeServicio,
        totalAreas: areasData.length,
        totalTurnos: turnos.length,
        neonatosActivos: neonatos,
      });

      setRecentPatients(
        (episodios?.datos ?? []).slice(0, 8).map((e) => ({
          episodioId: e.episodioId,
          nombre: e.nombre,
          apellidos: e.apellidos,
          areaNombre: e.areaNombre,
          nivelTriage: e.nivelTriage,
          fechaAdmision: e.fechaAdmision,
        })),
      );

      setTodayShifts(
        turnos.slice(0, 8).map((t) => ({
          id: t.id,
          nombreUsuario: t.nombreUsuario,
          apellidosUsuario: t.apellidosUsuario,
          nombreArea: t.nombreArea,
          fechaInicio: t.fechaInicio,
          fechaFin: t.fechaFin,
        })),
      );

      setAreas(areasData);
      setLoading(false);
    }

    void load();
  }, [user]);

  function fmtTime(iso: string) {
    // Backend returns local time strings — slice HH:mm directly, no Date conversion.
    return iso.slice(11, 16) || iso;
  }

  function fmtDate(iso: string) {
    const [y, m, d] = iso.slice(0, 10).split("-");
    return d && m && y ? `${d}/${m}/${y.slice(2)}` : iso;
  }

  return (
    <div className="py-6 px-8 xl:px-12 space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
            {loading ? (
              <span className="inline-block h-7 w-56 bg-slate-100 rounded animate-pulse" />
            ) : (
              data?.hospitalName ?? "Panel de administración"
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? (
              <span className="inline-block h-4 w-40 bg-slate-100 rounded animate-pulse" />
            ) : (
              `Bienvenido, ${data?.adminName}`
            )}
          </p>
        </div>
        <span className="text-xs text-slate-400 font-medium mt-1">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Pacientes activos"
          value={loading ? "—" : (data?.totalEpisodiosActivos ?? 0)}
          accent="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <MetricCard
          label="Personal médico"
          value={loading ? "—" : ((data?.disponibles ?? 0) + (data?.ocupados ?? 0) + (data?.enBreak ?? 0))}
          sub={loading ? undefined : `${data?.disponibles ?? 0} disponibles`}
          accent="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          }
        />
        <MetricCard
          label="Usuarios"
          value={loading ? "—" : (data?.totalUsuarios ?? 0)}
          sub={loading ? undefined : `${data?.bloqueados ?? 0} bloqueados`}
          accent={data && data.bloqueados > 0 ? "amber" : "slate"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          }
        />
        <MetricCard
          label="Turnos hoy"
          value={loading ? "—" : (data?.totalTurnos ?? 0)}
          accent="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
            </svg>
          }
        />
        <MetricCard
          label="Áreas"
          value={loading ? "—" : (data?.totalAreas ?? 0)}
          accent="slate"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
              <path d="M12 3v6" />
            </svg>
          }
        />
        <MetricCard
          label="Neonatos activos"
          value={loading ? "—" : (data?.neonatosActivos ?? 0)}
          sub="internados"
          accent="purple"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 12h.01" />
              <path d="M15 12h.01" />
              <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
              <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
            </svg>
          }
        />
      </div>

      {/* Two-column row: Pacientes activos + Disponibilidad */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active patients table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <SectionHeader title="Pacientes activos recientes" href="/patients" linkLabel="Ver todos" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5 text-left font-semibold">Paciente</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Área</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Triage</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Admisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                  : recentPatients.length === 0
                    ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                          No hay pacientes activos
                        </td>
                      </tr>
                    )
                    : recentPatients.map((p) => {
                      const cfg = TRIAGE_CONFIG[p.nivelTriage] ?? TRIAGE_CONFIG[TriageNivel.NoAplica];
                      return (
                        <tr key={p.episodioId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-[#1A2B5E] whitespace-nowrap">
                            {p.nombre} {p.apellidos}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.areaNombre}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bgCls} ${cfg.textCls}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(p.fechaAdmision)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff availability + Areas */}
        <div className="flex flex-col gap-6">
          {/* Availability breakdown */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <SectionHeader title="Disponibilidad del personal" href="/staff-monitoring" linkLabel="Ver personal" />
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Disponible", value: data?.disponibles ?? 0, bar: "bg-green-500", text: "text-green-700" },
                  { label: "Ocupado", value: data?.ocupados ?? 0, bar: "bg-[#09268E]", text: "text-[#09268E]" },
                  { label: "En break", value: data?.enBreak ?? 0, bar: "bg-amber-400", text: "text-amber-600" },
                  { label: "Fuera de servicio", value: data?.fueraDeServicio ?? 0, bar: "bg-slate-400", text: "text-slate-600" },
                ].map((row) => {
                  const total =
                    (data?.disponibles ?? 0) +
                    (data?.ocupados ?? 0) +
                    (data?.enBreak ?? 0) +
                    (data?.fueraDeServicio ?? 0);
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{row.label}</span>
                        <span className={`text-sm font-bold ${row.text}`}>{row.value} <span className="text-xs font-normal text-slate-400">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Areas list */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex-1">
            <SectionHeader title="Áreas del hospital" href="/administration" linkLabel="Administrar" />
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : areas.length === 0 ? (
              <p className="text-sm text-slate-400">No hay áreas registradas</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {areas.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-[#09268E] flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{a.nombre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Triage breakdown */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
        <SectionHeader title="Distribución por nivel de triage" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-1">
          {(
            [
              TriageNivel.Reanimacion,
              TriageNivel.Emergencia,
              TriageNivel.Urgencia,
              TriageNivel.Prioritario,
              TriageNivel.NoUrgente,
              TriageNivel.NoAplica,
            ] as TriageNivel[]
          ).map((level) => {
            const cfg = TRIAGE_CONFIG[level];
            const count = data?.triageCounts[level] ?? 0;
            return (
              <div key={level} className={`rounded-xl border px-4 py-3 text-center ${cfg.bgCls} ${cfg.borderCls}`}>
                <p className={`text-2xl font-bold ${cfg.textCls}`}>{loading ? "—" : count}</p>
                <p className={`text-xs font-semibold mt-0.5 ${cfg.textCls}`}>{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's shifts */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <SectionHeader title="Turnos de hoy" href="/staff-monitoring" linkLabel="Ver todos los turnos" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left font-semibold">Personal</th>
                <th className="px-4 py-2.5 text-left font-semibold">Área</th>
                <th className="px-4 py-2.5 text-left font-semibold">Inicio</th>
                <th className="px-4 py-2.5 text-left font-semibold">Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                : todayShifts.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                        No hay turnos programados para hoy
                      </td>
                    </tr>
                  )
                  : todayShifts.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1A2B5E] whitespace-nowrap">
                        {t.nombreUsuario} {t.apellidosUsuario}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.nombreArea}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtTime(t.fechaInicio)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtTime(t.fechaFin)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

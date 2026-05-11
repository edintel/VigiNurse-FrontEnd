"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBracelets,
  createBracelet,
  updateBracelet,
  updateBraceletEstado,
} from "@/features/baby-monitoring/services/babyService";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { toast } from "@/lib/toast";
import {
  EstadoBrazalete,
  ESTADO_BRAZALETE_LABELS,
} from "@/features/baby-monitoring/types";
import type {
  Brazalete,
  PaginatedBrazaletes,
  CrearBrazaleteDTO,
  ActualizarBrazaleteDTO,
  CambiarEstadoBrazaleteDTO,
} from "@/features/baby-monitoring/types";

const PAGE_SIZE = 10;

// Estados que el usuario puede asignar manualmente (excluye Activo=1)
const ESTADOS_MANUALES: { value: EstadoBrazalete; label: string }[] = [
  { value: EstadoBrazalete.Disponible, label: "Disponible" },
  { value: EstadoBrazalete.Inactivo, label: "Inactivo" },
  { value: EstadoBrazalete.Perdido, label: "Perdido" },
  { value: EstadoBrazalete.Danado, label: "Dañado" },
  { value: EstadoBrazalete.Mantenimiento, label: "Mantenimiento" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return dateStr; }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return dateStr; }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoBrazalete }) {
  const map: Record<EstadoBrazalete, string> = {
    [EstadoBrazalete.Disponible]:   "bg-emerald-50 border-emerald-200 text-emerald-700",
    [EstadoBrazalete.Activo]:       "bg-blue-50 border-blue-200 text-blue-700",
    [EstadoBrazalete.Inactivo]:     "bg-slate-100 border-slate-200 text-slate-500",
    [EstadoBrazalete.Perdido]:      "bg-red-50 border-red-200 text-red-700",
    [EstadoBrazalete.Danado]:       "bg-orange-50 border-orange-200 text-orange-700",
    [EstadoBrazalete.Mantenimiento]:"bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[estado] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {ESTADO_BRAZALETE_LABELS[estado] ?? `Estado ${estado}`}
    </span>
  );
}

function BatteryBadge({ nivel }: { nivel: number | null }) {
  if (nivel === null) return <span className="text-slate-400 text-xs">—</span>;
  const cls =
    nivel >= 50 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : nivel >= 20 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-3">
        <path d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h10.5A2.25 2.25 0 0 1 18.75 7.5v.75h.375A2.625 2.625 0 0 1 21.75 10.875v2.25a2.625 2.625 0 0 1-2.625 2.625H18.75v.75A2.25 2.25 0 0 1 16.5 18.75H6A2.25 2.25 0 0 1 3.75 16.5V7.5Z" />
      </svg>
      {nivel}%
    </span>
  );
}

// ─── Modal: Registrar brazalete ───────────────────────────────────────────────

interface CreateBraceletModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (b: Brazalete) => void;
}

function CreateBraceletModal({ open, onClose, onCreated }: CreateBraceletModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [codigo, setCodigo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [direccionMac, setDireccionMac] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivelBateria, setNivelBateria] = useState("100");
  const [fechaAdquisicion, setFechaAdquisicion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setCodigo(""); setNumeroSerie(""); setDireccionMac("");
      setDescripcion(""); setNivelBateria("100");
      setFechaAdquisicion(new Date().toISOString().slice(0, 10));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const nivelNum = nivelBateria === "" ? null : parseInt(nivelBateria, 10);
  const nivelValido = nivelNum === null || (!isNaN(nivelNum) && nivelNum >= 0 && nivelNum <= 100);
  const isValid =
    codigo.trim().length > 0 &&
    direccionMac.trim().length > 0 &&
    fechaAdquisicion.length > 0 &&
    nivelValido;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const dto: CrearBrazaleteDTO = {
        codigo: codigo.trim(),
        direccionMac: direccionMac.trim(),
        numeroSerie: numeroSerie.trim() || null,
        descripcion: descripcion.trim() || null,
        nivelBateria: nivelNum,
        fechaAdquisicion: new Date(fechaAdquisicion).toISOString(),
      };
      const saved = await createBracelet(dto);
      toast.success("Brazalete registrado correctamente.");
      onCreated(saved);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo registrar el brazalete.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-lg p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Registrar brazalete</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Código <span className="text-red-500">*</span>
              </label>
              <input type="text" className="input input-bordered w-full text-sm font-mono"
                placeholder="Ej. BRZ-001" value={codigo}
                onChange={(e) => setCodigo(e.target.value)} disabled={submitting} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Número de serie <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              <input type="text" className="input input-bordered w-full text-sm font-mono"
                placeholder="Ej. SN-001" value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)} disabled={submitting} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Dirección MAC <span className="text-red-500">*</span>
            </label>
            <input type="text" className="input input-bordered w-full text-sm font-mono"
              placeholder="Ej. AA:BB:CC:DD:EE:FF" value={direccionMac}
              onChange={(e) => setDireccionMac(e.target.value)} disabled={submitting} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Descripción <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <input type="text" className="input input-bordered w-full text-sm"
              placeholder="Ej. Brazalete sala neonatos A" value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)} disabled={submitting} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Nivel de batería (%) <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              <input type="number" className="input input-bordered w-full text-sm"
                placeholder="100" min={0} max={100}
                value={nivelBateria} onChange={(e) => setNivelBateria(e.target.value)} disabled={submitting} />
              {nivelBateria !== "" && !nivelValido && (
                <p className="text-xs text-red-500 mt-1">Debe ser entre 0 y 100.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Fecha de adquisición <span className="text-red-500">*</span>
              </label>
              <input type="date" className="input input-bordered w-full text-sm"
                value={fechaAdquisicion} onChange={(e) => setFechaAdquisicion(e.target.value)} disabled={submitting} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn btn-sm text-white"
              style={!isValid || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!isValid || submitting}>
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Registrar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}

// ─── Modal: Editar brazalete ──────────────────────────────────────────────────

interface EditarBrazaleteModalProps {
  open: boolean;
  brazalete: Brazalete | null;
  onClose: () => void;
  onUpdated: (b: Brazalete) => void;
}

function EditarBrazaleteModal({ open, brazalete, onClose, onUpdated }: EditarBrazaleteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [numeroSerie, setNumeroSerie] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivelBateria, setNivelBateria] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && brazalete) {
      dialogRef.current?.showModal();
      setNumeroSerie(brazalete.numeroSerie ?? "");
      setDescripcion(brazalete.descripcion ?? "");
      setNivelBateria(brazalete.nivelBateria !== null ? String(brazalete.nivelBateria) : "");
    } else {
      dialogRef.current?.close();
    }
  }, [open, brazalete]);

  const nivelNum = nivelBateria === "" ? null : parseInt(nivelBateria, 10);
  const nivelValido = nivelNum === null || (!isNaN(nivelNum) && nivelNum >= 0 && nivelNum <= 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brazalete || !nivelValido) return;
    setSubmitting(true);
    try {
      const dto: ActualizarBrazaleteDTO = {
        numeroSerie: numeroSerie.trim() || null,
        descripcion: descripcion.trim() || null,
        nivelBateria: nivelNum,
      };
      const updated = await updateBracelet(brazalete.id, dto);
      toast.success("Brazalete actualizado.");
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo actualizar el brazalete.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Editar brazalete</h3>
          {brazalete && (
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{brazalete.codigo}</p>
          )}
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Número de serie
            </label>
            <input type="text" className="input input-bordered w-full text-sm font-mono"
              placeholder="Ej. SN-001" value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)} disabled={submitting} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Descripción
            </label>
            <input type="text" className="input input-bordered w-full text-sm"
              placeholder="Descripción del brazalete" value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)} disabled={submitting} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Nivel de batería (%)
            </label>
            <input type="number" className="input input-bordered w-full text-sm"
              placeholder="Ej. 85" min={0} max={100}
              value={nivelBateria} onChange={(e) => setNivelBateria(e.target.value)} disabled={submitting} />
            {nivelBateria !== "" && !nivelValido && (
              <p className="text-xs text-red-500 mt-1">Debe ser entre 0 y 100.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn btn-sm text-white"
              style={!nivelValido || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!nivelValido || submitting}>
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}

// ─── Modal: Cambiar estado ────────────────────────────────────────────────────

interface CambiarEstadoModalProps {
  open: boolean;
  brazalete: Brazalete | null;
  onClose: () => void;
  onUpdated: (b: Brazalete) => void;
}

function CambiarEstadoModal({ open, brazalete, onClose, onUpdated }: CambiarEstadoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [estado, setEstado] = useState<EstadoBrazalete>(EstadoBrazalete.Disponible);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Opciones disponibles: excluir Activo=1 y el estado actual del brazalete
  const opciones = ESTADOS_MANUALES.filter((o) => o.value !== brazalete?.estado);

  useEffect(() => {
    if (open && brazalete) {
      dialogRef.current?.showModal();
      setMotivo("");
      setEstado(opciones[0]?.value ?? EstadoBrazalete.Disponible);
    } else {
      dialogRef.current?.close();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brazalete?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brazalete) return;
    setSubmitting(true);
    try {
      const dto: CambiarEstadoBrazaleteDTO = {
        estado,
        motivo: motivo.trim() || null,
      };
      const updated = await updateBraceletEstado(brazalete.id, dto);
      toast.success(`Estado cambiado a "${ESTADO_BRAZALETE_LABELS[estado]}".`);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo cambiar el estado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Cambiar estado</h3>
          {brazalete && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">{brazalete.codigo}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">Estado actual:</span>
              <EstadoBadge estado={brazalete.estado} />
            </div>
          )}
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
            <p className="text-xs text-amber-800">
              El estado <strong>Activo</strong> lo asigna el sistema automáticamente al vincular el brazalete a un bebé.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Nuevo estado <span className="text-red-500">*</span>
            </label>
            {opciones.length === 0 ? (
              <p className="text-sm text-slate-500">No hay estados disponibles para cambiar.</p>
            ) : (
              <select className="select select-bordered w-full text-sm"
                value={estado}
                onChange={(e) => setEstado(Number(e.target.value) as EstadoBrazalete)}
                disabled={submitting}>
                {opciones.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Motivo <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
              rows={3} placeholder="Motivo del cambio de estado..."
              value={motivo} onChange={(e) => setMotivo(e.target.value)} disabled={submitting} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn btn-sm text-white"
              style={opciones.length === 0 || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={opciones.length === 0 || submitting}>
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Confirmar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}

// Componente que muestra la lista de brazaletes y permite crear, editar y cambiar estado

export default function BraceletsPage() {
  const [brazaletes, setBrazaletes] = useState<Brazalete[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBrazalete, setSelectedBrazalete] = useState<Brazalete | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showCambiarEstado, setShowCambiarEstado] = useState(false);

  const fetchBrazaletes = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedBrazaletes = await getBracelets(page, PAGE_SIZE);
      setBrazaletes(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los brazaletes. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchBrazaletes(1); }, [fetchBrazaletes]);

  function handleCreated(b: Brazalete) {
    setBrazaletes((prev) => [b, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleUpdated(b: Brazalete) {
    setBrazaletes((prev) => prev.map((x) => (x.id === b.id ? b : x)));
  }

  function openEdit(b: Brazalete) {
    setSelectedBrazalete(b);
    setShowEdit(true);
  }

  function openCambiarEstado(b: Brazalete) {
    setSelectedBrazalete(b);
    setShowCambiarEstado(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-[#0f172a]">Brazaletes</h2>
        <button type="button" className="btn text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={() => setShowCreate(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-[1.2em]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Registrar brazalete
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void fetchBrazaletes(paginaActual)}>Reintentar</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Código / N° Serie</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Dirección MAC</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Batería</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Última señal</th>
                <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">F. Adquisición</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : !error && brazaletes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-base-content/40 text-sm">
                    No hay brazaletes registrados.
                  </td>
                </tr>
              ) : (
                brazaletes.map((b) => (
                  <tr key={b.id} className="hover:bg-base-200">
                    <td>
                      <span className="font-mono font-semibold text-sm text-[#0f172a] block">{b.codigo}</span>
                      {b.numeroSerie && <span className="font-mono text-xs text-slate-400">{b.numeroSerie}</span>}
                    </td>
                    <td className="text-sm text-[#475569] font-mono whitespace-nowrap">{b.direccionMac}</td>
                    <td className="text-sm text-[#475569]">
                      {b.descripcion ?? <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td><BatteryBadge nivel={b.nivelBateria} /></td>
                    <td className="text-sm text-[#475569] whitespace-nowrap">{formatDateTime(b.ultimaSenal)}</td>
                    <td className="text-sm text-[#475569] whitespace-nowrap">{formatDate(b.fechaAdquisicion)}</td>
                    <td><EstadoBadge estado={b.estado} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {/* Editar: solo campos editables */}
                        <button type="button" className="btn btn-square btn-xs btn-ghost text-slate-500"
                          title="Editar" onClick={() => openEdit(b)}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        {/* Cambiar estado: no disponible si está Activo (asignado) */}
                        <button type="button"
                          className="btn btn-square btn-xs btn-ghost text-slate-500"
                          title="Cambiar estado"
                          disabled={b.estado === EstadoBrazalete.Activo}
                          onClick={() => openCambiarEstado(b)}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={brazaletes.length}
          onPageChange={(page) => void fetchBrazaletes(page)}
        />
      </div>

      <CreateBraceletModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />

      <EditarBrazaleteModal
        open={showEdit}
        brazalete={selectedBrazalete}
        onClose={() => { setShowEdit(false); setSelectedBrazalete(null); }}
        onUpdated={handleUpdated}
      />

      <CambiarEstadoModal
        open={showCambiarEstado}
        brazalete={selectedBrazalete}
        onClose={() => { setShowCambiarEstado(false); setSelectedBrazalete(null); }}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

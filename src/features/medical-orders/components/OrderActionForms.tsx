import type { ArchivoOrdenDto } from "@/features/patients/types";
import { InlineFileManager } from "./InlineFileManager";

// ─── In Progress Form ─────────────────────────────────────────────────────────

interface InProgressFormProps {
  saving: boolean;
  actionError: string | null;
  onVolver: () => void;
  onConfirm: () => void;
}

export function InProgressForm({ saving, actionError, onVolver, onConfirm }: InProgressFormProps) {
  return (
    <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-5 space-y-4">
      <p className="text-sm font-bold text-[#1d4ed8]">¿Iniciar esta orden?</p>
      <p className="text-sm text-[#475569]">
        Esto marcará la orden como <strong>En proceso</strong>. Podrás completarla o cancelarla después.
      </p>
      {actionError && (
        <div role="alert" className="alert alert-error text-sm py-2.5">
          <span>{actionError}</span>
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onVolver}>
          Volver
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onConfirm}
          className="btn btn-sm text-white disabled:opacity-60"
          style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}
        >
          {saving && <span className="loading loading-spinner loading-xs" />}
          Confirmar
        </button>
      </div>
    </div>
  );
}

// ─── Complete Order Form ──────────────────────────────────────────────────────

interface CompleteOrderFormProps {
  ordenId: number;
  esImagen: boolean;
  saving: boolean;
  pacsCheckLoading: boolean;
  pacsVinculado: boolean;
  observacion: string;
  archivos: ArchivoOrdenDto[];
  loadingArchivos: boolean;
  actionError: string | null;
  onObservacionChange: (v: string) => void;
  onArchivosChange: (lista: ArchivoOrdenDto[]) => void;
  onVincularPACS: () => void;
  onVolver: () => void;
  onConfirm: () => void;
}

export function CompleteOrderForm({
  ordenId,
  esImagen,
  saving,
  pacsCheckLoading,
  pacsVinculado,
  observacion,
  archivos,
  loadingArchivos,
  actionError,
  onObservacionChange,
  onArchivosChange,
  onVincularPACS,
  onVolver,
  onConfirm,
}: CompleteOrderFormProps) {
  const confirmDisabled = saving || pacsCheckLoading || (esImagen ? !pacsVinculado : !observacion.trim());

  return (
    <div className="bg-white rounded-xl border border-[#d1fae5] shadow-sm p-5 space-y-4">
      <p className="text-sm font-bold text-[#065f46]">Completar orden médica</p>

      {/* Archivos adjuntos o estudio PACS */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2">
          {esImagen ? "Estudio PACS vinculado" : "Archivos adjuntos"}
        </p>
        {esImagen ? (
          <div className="flex items-center gap-3">
            {pacsCheckLoading ? (
              <span className="loading loading-spinner loading-sm text-[#09268E]" />
            ) : pacsVinculado ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth="2" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Estudio vinculado correctamente.
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-400">Sin estudio vinculado aún.</p>
                <button
                  type="button"
                  onClick={onVincularPACS}
                  className="btn btn-sm btn-outline border-[#09268E] text-[#09268E] hover:bg-[#09268E] hover:text-white gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth="2" stroke="currentColor" className="size-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                  Vincular estudio PACS
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {loadingArchivos ? (
              <span className="loading loading-spinner loading-sm text-[#09268E]" />
            ) : (
              <InlineFileManager
                ordenId={ordenId}
                archivos={archivos}
                onArchivosChange={onArchivosChange}
              />
            )}
          </>
        )}
      </div>

      {/* Observación — solo para órdenes no-imagen */}
      {!esImagen && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[#64748b] text-[11px] font-bold uppercase tracking-[0.55px]">
            Observación de ejecución <span className="text-[#f43f5e]">*</span>
          </label>
          <textarea
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg w-full px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#6b7280] min-h-[90px] focus:outline-none focus:border-[#09268E] transition-colors resize-none"
            placeholder="Ingrese observaciones sobre la ejecución de la orden…"
            value={observacion}
            onChange={(e) => onObservacionChange(e.target.value)}
          />
        </div>
      )}

      {actionError && (
        <div role="alert" className="alert alert-error text-sm py-2.5">
          <span>{actionError}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onVolver}>
          Volver
        </button>
        <button
          type="button"
          disabled={confirmDisabled}
          onClick={onConfirm}
          className="btn btn-sm text-white disabled:opacity-60"
          style={{ backgroundColor: "#059669", borderColor: "#059669" }}
        >
          {saving && <span className="loading loading-spinner loading-xs" />}
          Confirmar
        </button>
      </div>
    </div>
  );
}

// ─── Cancel Order Form ────────────────────────────────────────────────────────

interface CancelOrderFormProps {
  saving: boolean;
  actionError: string | null;
  justificacion: string;
  onJustificacionChange: (v: string) => void;
  onVolver: () => void;
  onConfirm: () => void;
}

export function CancelOrderForm({
  saving,
  actionError,
  justificacion,
  onJustificacionChange,
  onVolver,
  onConfirm,
}: CancelOrderFormProps) {
  return (
    <div className="bg-white rounded-xl border border-[#fecdd3] shadow-sm p-5 space-y-4">
      <p className="text-sm font-bold text-[#e11d48]">Cancelar orden médica</p>
      {actionError && (
        <div role="alert" className="alert alert-error text-sm py-2.5">
          <span>{actionError}</span>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-[#64748b] text-[11px] font-bold uppercase tracking-[0.55px]">
          Justificación <span className="text-[#f43f5e]">*</span>
        </label>
        <textarea
          className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg w-full px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#6b7280] min-h-[90px] focus:outline-none focus:border-[#09268E] transition-colors resize-none"
          placeholder="Ingrese el motivo de cancelación…"
          value={justificacion}
          onChange={(e) => onJustificacionChange(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onVolver}>
          Volver
        </button>
        <button
          type="button"
          disabled={!justificacion.trim() || saving}
          onClick={onConfirm}
          className="btn btn-sm btn-error font-bold disabled:opacity-60"
        >
          {saving && <span className="loading loading-spinner loading-xs" />}
          Confirmar cancelación
        </button>
      </div>
    </div>
  );
}

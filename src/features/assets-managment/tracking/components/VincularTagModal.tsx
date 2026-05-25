"use client";
import { useEffect, useRef, useState } from "react";
import { getTagsBle } from "@/features/assets-managment/tracking/services/tagBleService";
import { createAsignacionTagActivo } from "@/features/assets-managment/tracking/services/asignacionTagActivoService";
import {
  EstadoTagBle,
  type TagBle,
  type AsignacionTagActivoDto,
} from "@/features/assets-managment/tracking/types";
import { toast } from "@/lib/toast";

interface VincularTagModalProps {
  open: boolean;
  activoId: number;
  onClose: () => void;
  onVinculado: (asignacion: AsignacionTagActivoDto) => void;
}

function mVToPercent(mv: number): number {
  return Math.min(100, Math.max(0, Math.round((mv - 2000) / 1000 * 100)));
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Sin señal";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace unos segundos";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} días`;
}

export function VincularTagModal({
  open,
  activoId,
  onClose,
  onVinculado,
}: VincularTagModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tags, setTags] = useState<TagBle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setApiError(null);
      dialogRef.current?.showModal();
      setLoadingTags(true);
      // Carga tags activos y sin activo asignado
      getTagsBle(1, 100, { estado: EstadoTagBle.Activo })
        .then((res) => {
          setTags(res.datos.filter((t) => t.activoId === null));
        })
        .catch(() => setTags([]))
        .finally(() => setLoadingTags(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleConfirm() {
    if (selectedId === null) return;
    setLoading(true);
    setApiError(null);
    try {
      const asignacion = await createAsignacionTagActivo({
        tagBleId: selectedId,
        activoId,
      });
      const tag = tags.find((t) => t.id === selectedId);
      toast.success(`Tag "${tag?.codigo}" vinculado al activo.`);
      onVinculado(asignacion);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo vincular el tag. Intente nuevamente.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-white w-full max-w-lg overflow-hidden p-0">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1A2B5E 0%, #09268E 100%)" }}
        >
          
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Vincular tag
            </h3>
            <p className="text-sm text-blue-200 mt-0.5">
              Selecciona un tag activo disponible
            </p>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
          {apiError && (
            <div role="alert" className="alert alert-error text-sm py-2.5">
              <span>{apiError}</span>
            </div>
          )}

          {loadingTags ? (
            <div className="flex items-center justify-center py-10">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-slate-200"
              >
                <path d="m6.5 6.5 11 11M17.5 6.5 12 12l5.5 5.5M6.5 6.5 12 12l-5.5 5.5" />
              </svg>
              <p className="text-sm font-medium text-slate-500">
                No hay tags activos disponibles
              </p>
              <p className="text-xs text-slate-400">
                Todos los tags  activos ya están asignados a un activo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={[
                    "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    selectedId === tag.id
                      ? "border-[#09268E] bg-blue-50"
                      : "border-[#E2E8F0] bg-white hover:border-[#09268E]/30 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="tag-select"
                    className="radio radio-sm"
                    style={{ accentColor: "#09268E" }}
                    checked={selectedId === tag.id}
                    onChange={() => setSelectedId(tag.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-[#09268E]">
                        {tag.codigo}
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {tag.direccionMac}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>
                        {tag.nivelBateria !== null ? (
                          <>
                            <span
                              className={
                                mVToPercent(tag.nivelBateria) > 60
                                  ? "text-emerald-600 font-semibold"
                                  : mVToPercent(tag.nivelBateria) > 20
                                    ? "text-yellow-600 font-semibold"
                                    : "text-red-600 font-semibold"
                              }
                            >
                              {mVToPercent(tag.nivelBateria)}%
                            </span>
                            {" "}
                            <span className="text-slate-400">
                              ({tag.nivelBateria} mV)
                            </span>
                          </>
                        ) : (
                          "Batería desconocida"
                        )}
                      </span>
                      <span>·</span>
                      <span>{formatRelative(tag.ultimaSenal)}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={loading || selectedId === null || tags.length === 0}
              onClick={handleConfirm}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Vinculando..." : "Vincular tag"}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import {
  getOrderAttachments,
  uploadOrderAttachment,
  downloadOrderAttachment,
  deleteOrderAttachment,
} from "@/features/medical-orders/services/medicalOrdersService";
import type { ArchivoOrdenDto, OrdenMedicaDto } from "@/features/patients/types";
import { formatDate, formatBytes } from "@/features/medical-orders/utils/formatters";
import { toast } from "@/lib/toast";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/tiff"];
const ALLOWED_LABEL = "PDF, JPEG, PNG o TIFF (máx. 20 MB)";

interface Props {
  orden: OrdenMedicaDto;
  onClose: () => void;
}

export function OrderAttachmentsModal({ orden, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archivos, setArchivos] = useState<ArchivoOrdenDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderAttachments(orden.id);
      setArchivos(data);
    } catch {
      setError("No se pudieron cargar los archivos adjuntos.");
      toast.error("No se pudieron cargar los archivos adjuntos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = "Tipo de archivo no permitido. Use " + ALLOWED_LABEL;
      setUploadError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = "El archivo excede el tamaño máximo de 20 MB.";
      setUploadError(msg);
      toast.error(msg);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const nuevo = await uploadOrderAttachment(orden.id, file);
      setArchivos((prev) => [...prev, nuevo]);
      toast.success("Archivo adjunto cargado correctamente.");
    } catch {
      const msg = "Error al subir el archivo. Intente nuevamente.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(archivo: ArchivoOrdenDto) {
    setDownloadingId(archivo.id);
    try {
      const blob = await downloadOrderAttachment(archivo.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = archivo.nombreOriginal;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado correctamente.");
    } catch {
      toast.error("No se pudo descargar el archivo.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(archivoId: number) {
    setDeletingId(archivoId);
    try {
      await deleteOrderAttachment(archivoId);
      setArchivos((prev) => prev.filter((a) => a.id !== archivoId));
      toast.success("Archivo eliminado correctamente.");
    } catch {
      toast.error("No se pudo eliminar el archivo.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#1A2B5E]">
              Archivos adjuntos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Orden #{orden.id}
              {orden.descripcion ? ` — ${orden.descripcion}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost flex-shrink-0"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* Upload */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
            className="hidden"
            onChange={(e) => void handleUpload(e)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm text-white w-full"
            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          >
            {uploading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth="2" stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            )}
            {uploading ? "Subiendo…" : "Subir archivo"}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-1">{ALLOWED_LABEL}</p>
          {uploadError && (
            <p className="text-xs text-red-600 mt-1 text-center">{uploadError}</p>
          )}
        </div>

        {/* List */}
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
          {loading && (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-8 text-sm text-red-600 px-4">{error}</div>
          )}
          {!loading && !error && archivos.length === 0 && (
            <div className="text-center py-10 text-sm text-slate-400">
              No hay archivos adjuntos.
            </div>
          )}
          {!loading && !error && archivos.length > 0 && (
            <table className="table table-sm w-full [&_td]:py-2.5 [&_th]:py-2">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                  <th className="text-xs font-semibold uppercase tracking-wide">Archivo</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Tamaño</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Subido</th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {archivos.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="max-w-[200px]">
                      <p className="text-sm text-[#1e293b] font-medium truncate">{a.nombreOriginal}</p>
                      <p className="text-xs text-slate-400">{a.nombreUsuario}</p>
                    </td>
                    <td className="text-sm text-slate-500 whitespace-nowrap">
                      {formatBytes(a.tamanioBytes)}
                    </td>
                    <td className="text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(a.fechaSubida)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Descargar"
                          disabled={downloadingId === a.id}
                          onClick={() => void handleDownload(a)}
                          className="btn btn-square btn-xs btn-ghost text-[#09268E]"
                        >
                          {downloadingId === a.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                              strokeWidth="2" stroke="currentColor" className="size-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          disabled={deletingId === a.id}
                          onClick={() => void handleDelete(a.id)}
                          className="btn btn-square btn-xs btn-ghost text-red-500"
                        >
                          {deletingId === a.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                              strokeWidth="2" stroke="currentColor" className="size-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-action mt-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}

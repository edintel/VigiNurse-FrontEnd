"use client";
import { useRef, useState } from "react";
import {
  uploadOrderAttachment,
  downloadOrderAttachment,
  deleteOrderAttachment,
} from "@/features/medical-orders/services/medicalOrdersService";
import type { ArchivoOrdenDto } from "@/features/patients/types";
import { formatBytes } from "@/features/medical-orders/utils/formatters";
import { toast } from "@/lib/toast";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/tiff"];

interface Props {
  ordenId: number;
  archivos: ArchivoOrdenDto[];
  onArchivosChange: (lista: ArchivoOrdenDto[]) => void;
}

export function InlineFileManager({ ordenId, archivos, onArchivosChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = "Tipo no permitido. Use PDF, JPEG, PNG o TIFF.";
      setUploadError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = "El archivo excede 20 MB.";
      setUploadError(msg);
      toast.error(msg);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const nuevo = await uploadOrderAttachment(ordenId, file);
      onArchivosChange([...archivos, nuevo]);
      toast.success("Archivo adjunto cargado correctamente.");
    } catch {
      const msg = "Error al subir el archivo.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(a: ArchivoOrdenDto) {
    setDownloadingId(a.id);
    try {
      const blob = await downloadOrderAttachment(a.id);
      const url = URL.createObjectURL(blob);
      const el = document.createElement("a");
      el.href = url;
      el.download = a.nombreOriginal;
      el.click();
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
      onArchivosChange(archivos.filter((a) => a.id !== archivoId));
      toast.success("Archivo eliminado correctamente.");
    } catch {
      toast.error("No se pudo eliminar el archivo.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
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
        className="btn btn-sm btn-outline border-[#09268E] text-[#09268E] hover:bg-[#09268E] hover:text-white gap-1.5"
      >
        {uploading ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth="2" stroke="currentColor" className="size-3.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        )}
        {uploading ? "Subiendo…" : "Subir archivo"}
      </button>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

      {archivos.length > 0 && (
        <div className="border border-[#E2E8F0] rounded-lg overflow-hidden mt-1">
          <table className="table table-sm w-full [&_td]:py-2 [&_th]:py-1.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">Archivo</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Tamaño</th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivos.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="text-sm text-[#1e293b] max-w-[180px] truncate">{a.nombreOriginal}</td>
                  <td className="text-xs text-slate-400">{formatBytes(a.tamanioBytes)}</td>
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
        </div>
      )}
    </div>
  );
}

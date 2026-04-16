"use client";
import { useEffect, useState } from "react";
import { getStudyDetail } from "@/features/patients/services/medicalImagesService";
import type { EstudioImagen } from "@/features/patients/types";
import { toast } from "@/lib/toast";

const OHIF_URL = process.env.NEXT_PUBLIC_OHIF_URL ?? "";

function formatFecha(fechaStr: string | null | undefined): string {
  if (!fechaStr) return "—";
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

interface OHIFViewerModalProps {
  estudio: EstudioImagen;
  onClose: () => void;
}

// Componente que muestra un modal con el visor OHIF embebido para un estudio específico.
export function OHIFViewerModal({ estudio, onClose }: OHIFViewerModalProps) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!OHIF_URL) {
      setError(
        "El visor OHIF no está configurado. Define la variable NEXT_PUBLIC_OHIF_URL.",
      );
      toast.error("El visor OHIF no está configurado correctamente.");
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const detalle = await getStudyDetail(estudio.id);
        const studyInstanceUID =
          detalle.orthancDetalle?.MainDicomTags?.StudyInstanceUID;

        if (!studyInstanceUID) {
          setError(
            "No se encontró el identificador DICOM (StudyInstanceUID) del estudio. " +
            "Verifica que Orthanc esté accesible desde el servidor y que el estudio " +
            "haya sido indexado correctamente.",
          );
          toast.error("No se encontró el identificador DICOM del estudio.");
          return;
        }

        const base = OHIF_URL.replace(/\/+$/, "");
        const url =
          `${base}/viewer` +
          `?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUID)}` +
          `&hospitalId=${estudio.hospitalId}` +
          `&leftPanelClosed=true`;
        setViewerUrl(url);
      } catch {
        setError("Error al obtener los datos del estudio desde el servidor.");
        toast.error("Error al obtener los datos del estudio para abrir el visor.");
      } finally {
        setLoading(false);
      }
    })();
  }, [estudio.hospitalId, estudio.id]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#1A2B5E] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5 text-white shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {estudio.tipoEstudio}
              {estudio.descripcion ? ` — ${estudio.descripcion}` : ""}
            </p>
            <p className="text-blue-200 text-xs">
              {formatFecha(estudio.fechaEstudio)} · {estudio.nombreHospital}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-ghost text-white hover:bg-white/10 shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Cerrar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg text-white" />
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-12 text-red-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="text-red-300 text-sm text-center max-w-sm">{error}</p>
            <button
              type="button"
              className="btn btn-sm btn-ghost text-white border-white/20"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        )}
        {!loading && viewerUrl && (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={`Visor OHIF — ${estudio.tipoEstudio}`}
            allow="fullscreen"
          />
        )}
      </div>
    </div>
  );
}

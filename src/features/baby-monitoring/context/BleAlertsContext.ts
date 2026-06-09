"use client";
import { createContext, useContext } from "react";

export interface AlertaBLEPush {
  id: number;
  tipo: string;
  severidad: string;
  brazaleteId: number;
  pacienteId: number | null;
  episodioId: number | null;
  zonaId: number | null;
  zonaNombre: string | null;
  descripcion: string;
  fechaCreacion: string;
}

export interface BleAlertsContextValue {
  /** Número de alertas abiertas conocidas (incrementa con cada push) */
  openCount: number;
  /** Última alerta recibida por push — para forzar refresh en listas */
  lastAlert: AlertaBLEPush | null;
  /** Forzar recarga del conteo (llamar después de reconocer/cerrar) */
  refresh: () => void;
}

export const BleAlertsContext = createContext<BleAlertsContextValue>({
  openCount: 0,
  lastAlert: null,
  refresh: () => {},
});

export function useBleAlerts() {
  return useContext(BleAlertsContext);
}

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

// Estructura de un signo vital capturado para un paciente.
export interface VitalSign {
  patientId: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation: number;
  temperature: number;
  respiratoryRate: number;
  hasAlert: boolean;
  timestamp: string;
}

// Estructura de alerta derivada del monitoreo de signos vitales.
export interface MonitorAlert {
  id: string;
  patientId: number;
  patientName?: string;
  parameter: keyof Omit<VitalSign, "patientId" | "hasAlert" | "timestamp">;
  value: number;
  threshold: { min: number; max: number };
  acknowledged: boolean;
  timestamp: string;
}

// Estado de vital signs.
export interface VitalSignsState {
  readings: Record<number, VitalSign>;
  monitorAlerts: MonitorAlert[];
  lastUpdated: Record<number, string>;
}

const initialState: VitalSignsState = {
  readings: {},
  monitorAlerts: [],
  lastUpdated: {},
};

export const vitalSignsSlice = createSlice({
  name: "vitalSigns",
  initialState,
  reducers: {
    // Placeholder reducers: módulo aún no implementado.
    updateVitalSign(_state, _action: PayloadAction<VitalSign>) {},
    setAllReadings(_state, _action: PayloadAction<VitalSign[]>) {},
    addMonitorAlert(_state, _action: PayloadAction<MonitorAlert>) {},
    acknowledgeMonitorAlert(_state, _action: PayloadAction<string>) {},
    removePatientReadings(_state, _action: PayloadAction<number>) {},
    clearVitalSigns(_state) {},
  },
});

export const {
  updateVitalSign,
  setAllReadings,
  addMonitorAlert,
  acknowledgeMonitorAlert,
  removePatientReadings,
  clearVitalSigns,
} = vitalSignsSlice.actions;

export const selectAllReadings = (state: RootState) =>
  state.vitalSigns.readings;
export const selectPatientVitals = (patientId: number) => (state: RootState) =>
  state.vitalSigns.readings[patientId] ?? null;
export const selectMonitorAlerts = (state: RootState) =>
  state.vitalSigns.monitorAlerts;
export const selectUnacknowledgedMonitorAlerts = (state: RootState) =>
  state.vitalSigns.monitorAlerts.filter((a) => !a.acknowledged);
export const selectPatientsWithAlerts = (state: RootState) =>
  Object.values(state.vitalSigns.readings).filter((r) => r.hasAlert);
export const selectLastUpdated = (patientId: number) => (state: RootState) =>
  state.vitalSigns.lastUpdated[patientId] ?? null;

export default vitalSignsSlice.reducer;

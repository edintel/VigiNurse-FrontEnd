import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

export type AlertSeverity = "critical" | "warning" | "info";

// Representa una alerta emitida por algún módulo del sistema.
export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  source: "vitals" | "nurse_calls" | "baby_monitoring" | "assets" | "system";
  patientId?: number;
  patientName?: string;
  roomId?: string;
  read: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
  timestamp: string;
}

// Estado de alerts.
export interface AlertsState {
  alerts: SystemAlert[];
  unreadCount: number;
  criticalCount: number;
  lastUpdated: string | null;
}

const initialState: AlertsState = {
  alerts: [],
  unreadCount: 0,
  criticalCount: 0,
  lastUpdated: null,
};

export const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    // Placeholder reducers: módulo aún no implementado.
    addAlert(_state, _action: PayloadAction<SystemAlert>) {},
    markAsRead(_state, _action: PayloadAction<string>) {},
    markAllAsRead(_state) {},
    acknowledgeAlert(
      _state,
      _action: PayloadAction<{ id: string; acknowledgedBy: string }>,
    ) {},
    setAlerts(_state, _action: PayloadAction<SystemAlert[]>) {},
    removeAlert(_state, _action: PayloadAction<string>) {},
    clearAlerts(_state) {},
  },
});

export const {
  addAlert,
  markAsRead,
  markAllAsRead,
  acknowledgeAlert,
  setAlerts,
  removeAlert,
  clearAlerts,
} = alertsSlice.actions;

export const selectAllAlerts = (state: RootState) => state.alerts.alerts;
export const selectUnreadCount = (state: RootState) => state.alerts.unreadCount;
export const selectCriticalCount = (state: RootState) =>
  state.alerts.criticalCount;
export const selectCriticalAlerts = (state: RootState) =>
  state.alerts.alerts.filter((a) => a.severity === "critical");
export const selectUnreadAlerts = (state: RootState) =>
  state.alerts.alerts.filter((a) => !a.read);
export const selectAlertsLastUpdated = (state: RootState) =>
  state.alerts.lastUpdated;

export default alertsSlice.reducer;

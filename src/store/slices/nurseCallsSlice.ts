import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

export type NurseCallStatus = "pending" | "assigned" | "resolved";
export type NurseCallPriority = "normal" | "urgent" | "critical";

// Representa una llamada de enfermería registrada en el sistema.
export interface NurseCall {
  id: string;
  roomId: string;
  bedId?: string;
  patientId?: number;
  patientName?: string;
  status: NurseCallStatus;
  priority: NurseCallPriority;
  assignedToId?: string;
  assignedToName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// Estado de nurse calls.
export interface NurseCallsState {
  activeCalls: NurseCall[];
  assignedCalls: NurseCall[];
  pendingCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NurseCallsState = {
  activeCalls: [],
  assignedCalls: [],
  pendingCount: 0,
  loading: false,
  error: null,
};

export const nurseCallsSlice = createSlice({
  name: "nurseCalls",
  initialState,
  reducers: {
    // Placeholder reducers: módulo aún no implementado.
    setLoading(_state, _action: PayloadAction<boolean>) {},
    setError(_state, _action: PayloadAction<string | null>) {},
    setActiveCalls(_state, _action: PayloadAction<NurseCall[]>) {},
    setAssignedCalls(_state, _action: PayloadAction<NurseCall[]>) {},
    addNurseCall(_state, _action: PayloadAction<NurseCall>) {},
    updateNurseCall(_state, _action: PayloadAction<NurseCall>) {},
    clearNurseCalls(_state) {},
  },
});

export const {
  setLoading,
  setError,
  setActiveCalls,
  setAssignedCalls,
  addNurseCall,
  updateNurseCall,
  clearNurseCalls,
} = nurseCallsSlice.actions;

export const selectActiveCalls = (state: RootState) =>
  state.nurseCalls.activeCalls;
export const selectAssignedCalls = (state: RootState) =>
  state.nurseCalls.assignedCalls;
export const selectPendingCount = (state: RootState) =>
  state.nurseCalls.pendingCount;
export const selectNurseCallsLoading = (state: RootState) =>
  state.nurseCalls.loading;
export const selectNurseCallsError = (state: RootState) =>
  state.nurseCalls.error;
export const selectCriticalCalls = (state: RootState) =>
  state.nurseCalls.activeCalls.filter((c) => c.priority === "critical");

export default nurseCallsSlice.reducer;

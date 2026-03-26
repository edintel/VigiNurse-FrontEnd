import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import uiReducer from "@/store/slices/uiSlice";
import alertsReducer from "@/store/slices/alertsSlice";
import nurseCallsReducer from "@/store/slices/nurseCallsSlice";
import vitalSignsReducer from "@/store/slices/vitalSignsSlice";

// Configuracion del store de Redux con los reducers de cada slice
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    alerts: alertsReducer,
    nurseCalls: nurseCallsReducer,
    vitalSigns: vitalSignsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// Tipos para el estado global y el dispatch del store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

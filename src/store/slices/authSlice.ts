import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, PersistedSession } from "@/types";
import type { RootState } from "@/store/store";

// Interface para el estado de autenticación.

export interface AuthState {
  isAuthenticated: boolean;
  sessionRestored: boolean;
  user: AuthUser | null;
  token: string | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

// Estado inicial de autenticación.

const initialState: AuthState = {
  isAuthenticated: false,
  sessionRestored: false,
  user: null,
  token: null,
  permissions: [],
  loading: false,
  error: null,
};

//Payload para la accion de login exitoso

export interface LoginSuccessPayload {
  user: AuthUser;
  token: string;
  permissions: string[];
}

// Slice de autenticación, con reducers para manejar el proceso de login/logout y restauración de sesión.

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Acción para iniciar el proceso de login.
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    // Acción para manejar un login exitoso, actualizando el estado con la información del usuario y token.
    loginSuccess(state, action: PayloadAction<LoginSuccessPayload>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.permissions = action.payload.permissions;
      state.loading = false;
      state.error = null;
    },
    // Acción para manejar un login fallido, actualizando el estado con el mensaje de error.
    loginFailure(state, action: PayloadAction<string>) {
      state.isAuthenticated = false;
      state.loading = false;
      state.error = action.payload;
    },
    // Acción para cerrar sesión, limpiando toda la información de autenticación del estado.
    logout(state) {
      state.isAuthenticated = false;
      state.sessionRestored = true;
      state.user = null;
      state.token = null;
      state.permissions = [];
      state.loading = false;
      state.error = null;
    },
    // Acción para restaurar una sesión desde localStorage, actualizando el estado con la información persistida.
    restoreSession(state, action: PayloadAction<PersistedSession>) {
      state.isAuthenticated = true;
      state.sessionRestored = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.permissions = action.payload.permissions;
      state.loading = false;
      state.error = null;
    },
    // Acción para marcar que la restauración de sesión ha sido completada, sin importar el resultado.
    markSessionRestored(state) {
      state.sessionRestored = true;
    },
    // Acción para limpiar cualquier mensaje de error relacionado con la autenticación.
    clearError(state) {
      state.error = null;
    },
  },
});

// Exportar las acciones generadas por el slice para ser utilizadas en los componentes

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  restoreSession,
  markSessionRestored,
  clearError,
} = authSlice.actions;

// Selectores para acceder a partes específicas del estado de autenticación desde los componentes.

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectSessionRestored = (state: RootState) =>
  state.auth.sessionRestored;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectCurrentRole = (state: RootState) =>
  state.auth.user?.role ?? null;
export const selectPermissions = (state: RootState) => state.auth.permissions;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

export const selectHasPermission = (permission: string) => (state: RootState) =>
  state.auth.permissions.includes(permission);

export default authSlice.reducer;

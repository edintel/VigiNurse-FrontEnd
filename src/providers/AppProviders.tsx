"use client";
import { useEffect } from "react";
import { StoreProvider } from "@/store/providers";
import { store } from "@/store/store";
import { restoreSession, markSessionRestored } from "@/store/slices/authSlice";
import { loadSession, clearSession } from "@/lib/session";
// Componente para restaurar la sesión del usuario al cargar la aplicación.
function SessionRestorer() {
  useEffect(() => {
    const session = loadSession();
    if (session?.token && session.user) {
      if (session.expiracion) {
        const expired = new Date(session.expiracion) <= new Date();
        if (expired) {
          clearSession();
          store.dispatch(markSessionRestored());
          return;
        }
      }
      store.dispatch(restoreSession(session));
    } else {
      store.dispatch(markSessionRestored());
    }
  }, []);
  return null;
}
interface AppProvidersProps {
  children: React.ReactNode;
}
// Componente que envuelve la aplicación con los proveedores necesarios, como el StoreProvider para el estado global y el SessionRestorer para restaurar la sesión del usuario.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StoreProvider>
      <SessionRestorer />
      {children}
    </StoreProvider>
  );
}

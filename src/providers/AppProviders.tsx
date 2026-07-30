"use client";
import { useEffect } from "react";
import { StoreProvider } from "@/store/providers";
import { store } from "@/store/store";
import { restoreSession, markSessionRestored } from "@/store/slices/authSlice";
import { loadSession, clearSession } from "@/lib/session";
import { NotificationsProvider } from "@/features/notifications/components/NotificationsProvider";
import { BleAlertsProvider } from "@/features/baby-monitoring/context/BleAlertsProvider";

function SessionRestorer() {
  useEffect(() => {
    const session = loadSession();
    // Ya no se valida la presencia del token: vive en la cookie httpOnly. Si la cookie
    // expiro o fue invalidada, la primera peticion respondera 401 y el interceptor
    // de axios limpiara la sesion y redirigira al login.
    if (session?.user) {
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

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StoreProvider>
      <SessionRestorer />
      <NotificationsProvider>
        <BleAlertsProvider>
          {children}
        </BleAlertsProvider>
      </NotificationsProvider>
    </StoreProvider>
  );
}

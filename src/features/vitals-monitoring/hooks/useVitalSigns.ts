"use client";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { createHubConnection } from "@/lib/signalr";
import { SIGNALR_HUB_URL } from "@/config/api";
import type { LecturaSignosVitales } from "@/features/vitals-monitoring/types";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

// Custom hook para suscribirse a actualizaciones de signos vitales de un paciente vía SignalR
export function useVitalSigns(pacienteId: number) {
  const [lectura, setLectura] = useState<LecturaSignosVitales | null>(null);
  const [estado, setEstado] = useState<ConnectionState>("connecting");
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const connection = createHubConnection(SIGNALR_HUB_URL);
    connectionRef.current = connection;
    let unmounted = false;

    connection.on("ActualizacionSignosVitales", (data: LecturaSignosVitales) => {
      if (!unmounted) setLectura(data);
    });

    connection.onclose(() => { if (!unmounted) setEstado("disconnected"); });
    connection.onreconnecting(() => { if (!unmounted) setEstado("connecting"); });
    connection.onreconnected(() => { if (!unmounted) setEstado("connected"); });

    connection
      .start()
      .then(async () => {
        if (unmounted) return;
        setEstado("connected");
        await connection.invoke("SuscribirPaciente", String(pacienteId));
      })
      .catch(() => { if (!unmounted) setEstado("error"); });

    return () => {
      unmounted = true;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection
          .invoke("DesuscribirPaciente", String(pacienteId))
          .catch(() => {})
          .finally(() => connection.stop().catch(() => {}));
      } else {
        connection.stop().catch(() => {});
      }
    };
  }, [pacienteId]);

  return { lectura, estado };
}

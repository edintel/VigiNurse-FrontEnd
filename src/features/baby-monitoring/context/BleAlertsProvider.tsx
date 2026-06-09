"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { createHubConnection } from "@/lib/signalr";
import { BLE_ALERTS_HUB_URL } from "@/config/api";
import { getAlerts } from "@/features/baby-monitoring/services/babyService";
import { EstadoAlertaBLE } from "@/features/baby-monitoring/types";
import Toastify from "toastify-js";
import { NurseAlertModal } from "@/features/baby-monitoring/components/NurseAlertModal";
import {
  BleAlertsContext,
  type AlertaBLEPush,
  type BleAlertsContextValue,
} from "./BleAlertsContext";

const FONT = "Montserrat, sans-serif";

function showBleAlertToast(alert: AlertaBLEPush) {
  const isCritical = alert.severidad === "Critica" || alert.severidad === "0";
  const bg = isCritical ? "#991b1b" : "#c2410c";
  const emoji = isCritical ? "🚨" : "⚠️";
  const nivel = isCritical ? "CRÍTICO" : "ALTA";
  const baby = alert.pacienteId
    ? `Paciente #${alert.pacienteId}`
    : "Neonato desconocido";

  Toastify({
    text: `${emoji} ${nivel} · ${baby} — ${alert.descripcion}`,
    duration: isCritical ? 10000 : 7000,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: bg,
      fontFamily: FONT,
      fontSize: "13px",
      fontWeight: "700",
      borderRadius: "8px",
      padding: "14px 18px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      maxWidth: "420px",
      lineHeight: "1.4",
    },
    onClick() {
      window.location.href = "/baby-monitoring";
    },
  }).showToast();
}

export function BleAlertsProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useAppSelector(selectCurrentUser);
  const isNurse = currentUser?.role === "ENFERMERO";
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [lastAlert, setLastAlert] = useState<AlertaBLEPush | null>(null);
  const [nurseAlerts, setNurseAlerts] = useState<AlertaBLEPush[]>([]);

  const loadCount = useCallback(async () => {
    try {
      const res = await getAlerts({ status: EstadoAlertaBLE.Abierta, pageSize: 1 });
      setOpenCount(res.totalRegistros);
    } catch {}
  }, []);

  useEffect(() => {
    if (currentUser?.id) void loadCount();
    else setOpenCount(0);
  }, [currentUser?.id, loadCount]);

  useEffect(() => {
    if (!currentUser?.id) {
      connectionRef.current?.stop().catch(() => {});
      connectionRef.current = null;
      return;
    }

    const connection = createHubConnection(BLE_ALERTS_HUB_URL);
    connectionRef.current = connection;

    connection.onreconnected(() => {
      connection.invoke("SuscribirTodas").catch(() => {});
      void loadCount();
    });

    connection.on("NuevaAlerta", (raw: AlertaBLEPush) => {
      setLastAlert(raw);
      setOpenCount((prev) => prev + 1);

      if (isNurse) {
        // Enfermeras: modal de pantalla completa
        setNurseAlerts((prev) => [...prev, raw]);
      } else {
        showBleAlertToast(raw);
      }
    });

    connection.start()
      .then(() => connection.invoke("SuscribirTodas").catch(() => {}))
      .catch(() => {});

    return () => {
      connection.invoke("DesuscribirTodas").catch(() => {});
      connection.off("NuevaAlerta");
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [currentUser?.id, isNurse, loadCount]);

  function dismissNurseAlert() {
    setNurseAlerts((prev) => prev.slice(1));
  }

  const value = useMemo<BleAlertsContextValue>(
    () => ({
      openCount,
      lastAlert,
      refresh: loadCount,
    }),
    [openCount, lastAlert, loadCount],
  );

  return (
    <BleAlertsContext.Provider value={value}>
      {children}
      {isNurse && nurseAlerts.length > 0 && (
        <NurseAlertModal alerts={nurseAlerts} onDismiss={dismissNurseAlert} />
      )}
    </BleAlertsContext.Provider>
  );
}

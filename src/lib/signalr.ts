import * as signalR from "@microsoft/signalr";

// Funcion que obtiene el token de autenticación desde el localStorage y lo formatea adecuadamente
function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("hospital_auth");
    if (!raw) return "";
    const { token } = JSON.parse(raw) as { token?: string };
    if (!token) return "";
    return token
      .replace(/^Bearer\s+/i, "")
      .replace(/^['"]+|['"]+$/g, "")
      .trim();
  } catch {
    return "";
  }
}

// Función que crea una conexión a un hub de SignalR utilizando la URL proporcionada y el token de autenticación
export function createHubConnection(hubUrl: string): signalR.HubConnection {
  const normalizedHubUrl = hubUrl.trim().replace(/\/+$/g, "");

  return new signalR.HubConnectionBuilder()
    .withUrl(normalizedHubUrl, {
      accessTokenFactory: getAuthToken,
      withCredentials: false,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

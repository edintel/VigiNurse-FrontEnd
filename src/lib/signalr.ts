import * as signalR from "@microsoft/signalr";

// Función que crea una conexión a un hub de SignalR.
// La autenticación viaja en la cookie de sesión httpOnly (withCredentials: true),
// igual que en el resto de las peticiones. Ya no se lee el token desde localStorage
// ni se envía por query string, donde además quedaría registrado en los logs del servidor.
export function createHubConnection(hubUrl: string): signalR.HubConnection {
  const normalizedHubUrl = hubUrl.trim().replace(/\/+$/g, "");

  return new signalR.HubConnectionBuilder()
    .withUrl(normalizedHubUrl, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

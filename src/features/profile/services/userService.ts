import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  UserProfile,
  ChangePasswordPayload,
  ChangePasswordResult,
} from "@/features/profile/types";
// Obtiene datos del perfil.
export async function getMyProfile(
  userId: number | string,
): Promise<UserProfile> {
  const response = await axiosInstance.get<UserProfile>(
    API_ENDPOINTS.users.me(userId),
  );
  return response.data;
}
// Actualizar la contrasena.
export async function updatePassword(
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResult> {
  try {
    await axiosInstance.post(API_ENDPOINTS.auth.changePassword, payload);
    return { success: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      const data = error.response.data as {
        message?: string;
        mensaje?: string;
      };
      return {
        success: false,
        error:
          data.mensaje ??
          data.message ??
          "No se pudo actualizar la contraseña.",
      };
    }
    return { success: false, error: "No se pudo conectar con el servidor." };
  }
}

import axiosInstance from "@/lib/axios";
import type { AxiosRequestConfig } from "axios";
// Obtiene los datos necesarios.
async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
}
// Ejecuta la logica de post.
async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
}
// Ejecuta la logica de put.
async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
}
// Ejecuta la logica de patch.
async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
}
// Ejecuta la logica de del.
async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
}
export const apiClient = { get, post, put, patch, del };

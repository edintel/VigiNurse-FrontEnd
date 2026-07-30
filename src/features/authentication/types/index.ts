export interface LoginCredentials {
  email: string;
  password: string;
}
// El JWT no forma parte de la respuesta que maneja el cliente web: el backend lo entrega
// en una cookie httpOnly. Solo se usa el perfil del usuario.
export interface LoginSuccessResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    hospitalId?: number | null;
  };
  expiracion?: string;
}

export interface BackendLoginApiResponse {
  // El backend sigue devolviendo el token en el cuerpo porque la app movil lo necesita
  // para guardarlo en SecureStore; el cliente web lo ignora y usa la cookie.
  token: string;
  expiracion?: string;
  usuario: {
    id: string | number;
    nombreCompleto: string;
    email: string;
    roles: string[];
    hospitalId?: number | null;
  };
}

export type LoginResult =
  | {
      success: true;
      data: LoginSuccessResponse;
    }
  | {
      success: false;
      error: string;
    };

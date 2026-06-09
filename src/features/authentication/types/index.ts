export interface LoginCredentials {
  email: string;
  password: string;
}
export interface LoginSuccessResponse {
  token: string;
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
  token: string;
  expiracion?: string;
  usuario: {
    id: string | number;
    nombreCompleto: string;
    email: string;
    roles: string[];
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

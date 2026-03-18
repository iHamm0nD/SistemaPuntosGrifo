export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    dni: string;
    telefono: string;
    tipo_usuario: string;
  };
}
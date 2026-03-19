export interface Usuario {
    id?: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono?: string;
    tipo_usuario: string;
    username: string;
    password?: string;
}

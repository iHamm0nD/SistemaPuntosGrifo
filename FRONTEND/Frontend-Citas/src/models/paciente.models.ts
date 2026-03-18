import { Usuario } from './usuario.models';

export interface Paciente {
  id: number;
  usuario: number | Usuario;
  fecha_nacimiento: Date | string;
  direccion: string;
}
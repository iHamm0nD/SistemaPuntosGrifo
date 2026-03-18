import { Cita } from "./cita.models";

export class RegistroVisitas {
  id: number;
  nombre: string;
  documento: string;
  hora_ingreso: string | Date;
  motivo: string;
  cita: Cita; 
}
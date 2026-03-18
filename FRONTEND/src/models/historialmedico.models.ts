import { Paciente } from "./paciente.models";

export class HistorialMedico {
    id: number;
    paciente: Paciente;
    observaciones: string;
    fecha: string | Date;
}
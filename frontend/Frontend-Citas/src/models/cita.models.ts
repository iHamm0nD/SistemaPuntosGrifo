import { Especialidad } from './especialidad.models';
import { Paciente } from './paciente.models';
import { Medico } from './medico.models';

export interface Cita {
  id?: number;
  fecha: string;
  hora: string;
  estado?: string;
  especialidad: number; 
  paciente: number;         
  medico: number;             
}
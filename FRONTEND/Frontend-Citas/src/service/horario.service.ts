import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Horario } from '../models/horario.models';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/horarios/'; // Ajusta si es necesario

  constructor(private http: HttpClient) {}

  getHorariosPorMedico(medicoId: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}?medico=${medicoId}`);
  }
}


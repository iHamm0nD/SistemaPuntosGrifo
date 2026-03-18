// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Cita } from '../models/cita.models';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class CitaService {
//   private apiUrl = 'http://127.0.0.1:8000/api/citas/';

//   constructor(private http: HttpClient) {}

//   registrarCita(cita: Cita): Observable<Cita> {
//     return this.http.post<Cita>(this.apiUrl, cita);
//   }
// }
import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Usuario } from "../models/usuario.models";
import { Paciente } from "../models/paciente.models";
import { Cita } from "../models/cita.models";
import { Medico } from "../models/medico.models";
import { Especialidad } from "../models/especialidad.models";
import { RegistroVisitas } from "../models/registrovisitas.models";
import { HistorialMedico } from "../models/historialmedico.models";
import { Administrador } from "../models/administrador.models";

@Injectable({
    providedIn: 'root'
})

export class ApiService {

    private ApiUrl = 'http://127.0.0.1:8000/api/';
    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
        })
    }
    constructor(private http: HttpClient) { }

    // =============================== USUARIO ================================
    public getUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.ApiUrl + 'usuario/');
    }

    public deleteUsuario(id:string): Observable<void>{
        return this.http.delete<void>(this.ApiUrl + 'usuario/' + id + "/");
    }

    public putUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(
        this.ApiUrl + 'usuario/' + usuario.id + '/',
        usuario,
        this.httpOptions
    );
    }

    public postUsuario(usuario: Usuario): Observable<Usuario> {
        return this.http.post<Usuario>(
            this.ApiUrl + 'usuario/',
            usuario,
            this.httpOptions
        );
    }

    // =============================== PACIENTE ================================
    
    public getPacientes(): Observable<Paciente[]> {
        return this.http.get<Paciente[]>(this.ApiUrl + 'paciente/');
    }

    public getPacienteId(): Observable<any> {
    return this.http.get<any>(this.ApiUrl + 'paciente-id/');
    }

    public deletePaciente(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'paciente/' + id + "/");
    }

    public putPaciente(paciente: Paciente): Observable<Paciente> {
        let body = JSON.stringify(paciente);
        return this.http.put<Paciente>(this.ApiUrl + 'paciente/' + paciente.id + "/", body, this.httpOptions);
    }

    public postPaciente(paciente: Paciente): Observable<Paciente> {
        let body = JSON.stringify(paciente);
        return this.http.post<Paciente>(this.ApiUrl + 'paciente/', body, this.httpOptions);
    }


    // =============================== CITA ================================
    public getCitas(): Observable<Cita[]> {
        return this.http.get<Cita[]>(this.ApiUrl + 'cita/');
    }

    public deleteCita(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'cita/' + id + "/");
    }

    public putCita(cita: Cita): Observable<Cita> {
        let body = JSON.stringify(cita);
        return this.http.put<Cita>(this.ApiUrl + 'cita/' + cita.id + "/", body, this.httpOptions);
    }

    public postCita(cita: Cita): Observable<Cita> {
        let body = JSON.stringify(cita);
        return this.http.post<Cita>(this.ApiUrl + 'cita/', body, this.httpOptions);
    }

    // =============================== MEDICO ================================
    public getMedicos(especialidadId?: number): Observable<any[]> {
    const url = especialidadId
        ? `${this.ApiUrl}medico/?especialidad=${especialidadId}`
        : `${this.ApiUrl}medico/`;
        
    return this.http.get<any[]>(url);
    }

    public deleteMedico(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'medico/' + id + "/");
    }

    public putMedico(medico: Medico): Observable<Medico> {
        let body = JSON.stringify(medico);
        return this.http.put<Medico>(this.ApiUrl + 'medico/' + medico.id + "/", body, this.httpOptions);
    }

    public postMedico(medico: Medico): Observable<Medico> {
        let body = JSON.stringify(medico);
        return this.http.post<Medico>(this.ApiUrl + 'medico/', body, this.httpOptions);
    }


    // =============================== ESPECIALIDAD ================================
    public getEspecialidades(): Observable<Especialidad[]> {
        return this.http.get<Especialidad[]>(this.ApiUrl + 'especialidad/');
    }

    public deleteEspecialidad(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'especialidad/' + id + "/");
    }

    public putEspecialidad(especialidad: Especialidad): Observable<Especialidad> {
        let body = JSON.stringify(especialidad);
        return this.http.put<Especialidad>(this.ApiUrl + 'especialidad/' + especialidad.id + "/", body, this.httpOptions);
    }

    public postEspecialidad(especialidad: Especialidad): Observable<Especialidad> {
    let body = JSON.stringify(especialidad);
    return this.http.post<Especialidad>(this.ApiUrl + 'especialidad/', body, this.httpOptions);
    }

    // =============================== REGISTRO VISITAS================================
    public getRegistroVisitas(): Observable<RegistroVisitas[]> {
        return this.http.get<RegistroVisitas[]>(this.ApiUrl + 'registrovisitas/');
    }

    public deleteRegistroVisita(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'registrovisitas/' + id + "/");
    }

    public putRegistroVisita(visita: RegistroVisitas): Observable<RegistroVisitas> {
        let body = JSON.stringify(visita);
        return this.http.put<RegistroVisitas>(this.ApiUrl + 'registrovisitas/' + visita.id + "/", body, this.httpOptions);
    }

    public postRegistroVisita(visita: RegistroVisitas): Observable<RegistroVisitas> {
        let body = JSON.stringify(visita);
        return this.http.post<RegistroVisitas>(this.ApiUrl + 'registrovisitas/', body, this.httpOptions);
    }

    // =============================== HISTORIAL MEDICO ================================
    public getHistoriales(): Observable<HistorialMedico[]> {
        return this.http.get<HistorialMedico[]>(this.ApiUrl + 'historialmedico/');
    }

    public deleteHistorial(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'historialmedico/' + id + "/");
    }

    public putHistorial(historial: HistorialMedico): Observable<HistorialMedico> {
        let body = JSON.stringify(historial);
        return this.http.put<HistorialMedico>(this.ApiUrl + 'historialmedico/' + historial.id + "/", body, this.httpOptions);
    }

    public postHistorial(historial: HistorialMedico): Observable<HistorialMedico> {
        let body = JSON.stringify(historial);
        return this.http.post<HistorialMedico>(this.ApiUrl + 'historialmedico/', body, this.httpOptions);
    }

    // =============================== ADMINISTRADOR ================================
    public getAdministradores(): Observable<Administrador[]> {
        return this.http.get<Administrador[]>(this.ApiUrl + 'administrador/');
    }

    public deleteAdministrador(id: string): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'administrador/' + id + "/");
    }

    public putAdministrador(admin: Administrador): Observable<Administrador> {
        let body = JSON.stringify(admin);
        return this.http.put<Administrador>(this.ApiUrl + 'administrador/' + admin.id + "/", body, this.httpOptions);
    }

    public postAdministrador(admin: Administrador): Observable<Administrador> {
        let body = JSON.stringify(admin);
        return this.http.post<Administrador>(this.ApiUrl + 'administrador/', body, this.httpOptions);
    }


    postHorario(horario: any): Observable<any> {
    return this.http.post<any>(this.ApiUrl + 'horario/', horario, this.httpOptions);
    }

    getHorasDisponibles(fecha: string, medicoId: number) {
    return this.http.get<any>(`http://127.0.0.1:8000/api/cita/horas-disponibles/?fecha=${fecha}&medico_id=${medicoId}`);
    }
    

}
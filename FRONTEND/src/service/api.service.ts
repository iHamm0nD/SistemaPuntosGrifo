import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Usuario } from "../models/usuario.models";
import { TipoCombustible } from "../models/combustible.models";
import { Cliente } from "../models/cliente.models";
import { RegistrarConsumoRequest, RegistrarConsumoResponse, DashboardData } from "../models/consumo.models";
import { environment } from "../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private ApiUrl = environment.apiUrl;
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

    public getUsuariosPorTipo(tipo: string): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(this.ApiUrl + 'usuario/?tipo=' + tipo);
    }

    public deleteUsuario(id: string): Observable<void> {
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

    // =============================== TIPO COMBUSTIBLE ================================
    public getTiposCombustible(): Observable<TipoCombustible[]> {
        return this.http.get<TipoCombustible[]>(this.ApiUrl + 'tipo-combustible/');
    }

    public putTipoCombustible(id: number | undefined, data: TipoCombustible): Observable<TipoCombustible> {
        return this.http.put<TipoCombustible>(
            this.ApiUrl + 'tipo-combustible/' + id + '/',
            data,
            this.httpOptions
        );
    }

    // =============================== CLIENTE ================================
    public getClientes(): Observable<Cliente[]> {
        return this.http.get<Cliente[]>(this.ApiUrl + 'cliente/');
    }

    public getRankingClientes(top: number = 20): Observable<Cliente[]> {
        return this.http.get<Cliente[]>(this.ApiUrl + 'cliente/ranking/?top=' + top);
    }

    public buscarClientePorDni(dni: string): Observable<Cliente> {
        return this.http.get<Cliente>(this.ApiUrl + 'cliente/buscar-dni/?dni=' + dni);
    }

    // =============================== REGISTRO CONSUMO ================================
    public registrarConsumo(data: RegistrarConsumoRequest): Observable<RegistrarConsumoResponse> {
        return this.http.post<RegistrarConsumoResponse>(
            this.ApiUrl + 'registrar-consumo/',
            data,
            this.httpOptions
        );
    }

    public getRegistrosConsumo(page: number = 1, search: string = ''): Observable<any> {
        let url = this.ApiUrl + 'registro-consumo/?page=' + page;
        if (search) {
            url += '&search=' + search;
        }
        return this.http.get<any>(url);
    }

    public deleteRegistroConsumo(id: number): Observable<void> {
        return this.http.delete<void>(this.ApiUrl + 'registro-consumo/' + id + '/');
    }

    // =============================== DASHBOARD ================================
    public getDashboard(periodo: string = 'total'): Observable<DashboardData> {
        return this.http.get<DashboardData>(`${this.ApiUrl}dashboard/?periodo=${periodo}`);
    }

    public cambiarPasswordEmpleado(usuarioId: number, nuevaPassword: string): Observable<any> {
        return this.http.post<any>(
            this.ApiUrl + 'cambiar-password/',
            { usuario_id: usuarioId, nueva_password: nuevaPassword },
            this.httpOptions
        );
    }

    public validarPassword(password: string): Observable<any> {
        return this.http.post<any>(
            this.ApiUrl + 'validar-password/',
            { password: password },
            this.httpOptions
        );
    }

    // =============================== EXTERNAL APIS =================================
    public consultarDNI(dni: string): Observable<any> {
        return this.http.get<any>(`${this.ApiUrl}consultar-dni/${dni}/`);
    }
}
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { LoginResponse } from "../models/loginresponse.models";
import { environment } from "../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private loginUrl = `${environment.apiUrl}login/`;

    constructor(private http: HttpClient) {}

    login(username: string, password: string) {
        return this.http.post<LoginResponse>(this.loginUrl, { username, password }).pipe(
            tap(response => {
                localStorage.setItem('token', response.token);
                localStorage.setItem('tipo_usuario', response.usuario.tipo_usuario);
                localStorage.setItem('usuario', JSON.stringify(response.usuario));
            })
        );
    }

    getTipoUsuario(): string | null {
        return localStorage.getItem('tipo_usuario');
    }

    getUsuario(): any {
        const data = localStorage.getItem('usuario');
        return data ? JSON.parse(data) : null;
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        return !!token;
    }

    isEmpleado(): boolean {
        return this.getTipoUsuario() === 'empleado';
    }

    isDueno(): boolean {
        return this.getTipoUsuario() === 'dueno';
    }

    isDev(): boolean {
        return this.getTipoUsuario() === 'dev';
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo_usuario');
        localStorage.removeItem('usuario');
    }
}

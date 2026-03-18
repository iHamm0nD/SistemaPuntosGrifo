import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import {tap} from 'rxjs/operators';
import { LoginResponse } from "../models/loginresponse.models";

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private loginUrl = 'http://127.0.0.1:8000/api/login/';
    private registroUrl = 'http://127.0.0.1:8000/api/registro/'; 
    apiKey= 'iEpeJsgQbWzbNEirdKEWnYPf';

    constructor(private http: HttpClient) {}

    registrar(datos: any) {
        const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
        });

        return this.http.post(this.registroUrl, datos, { headers });
    }


    login(username: string, password: string) {
        return this.http.post<LoginResponse>(this.loginUrl, { username, password }).pipe(
            tap(response => {
            localStorage.setItem('token', response.token);
            localStorage.setItem('tipo_usuario', response.usuario.tipo_usuario);
            })
        );
    }

    getTipoUsuario(): string | null {
        return localStorage.getItem('tipo_usuario');
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        return !!token;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('tipo_usuario');
    }

    getPerfil() {
    return this.http.get<any>('http://127.0.0.1:8000/api/perfil/', {
        headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });
    }

    actualizarPerfil(data: any) {
    return this.http.put<any>('http://127.0.0.1:8000/api/perfil/', data, {
        headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });
    }

}

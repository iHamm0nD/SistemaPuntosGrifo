import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const tipo = this.auth.getTipoUsuario();

    if (tipo === 'admin') {
      return true;
      
    }

    this.router.navigate(['/index']);
         
    return false;
  }
}
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isEmpleado() || this.auth.isDev()) {
      return true;
    }

    if (this.auth.isDueno()) {
      this.router.navigate(['/dashboard-admin']);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
}

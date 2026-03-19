import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        const tipo = res.usuario.tipo_usuario;

        if (tipo === 'dueno' || tipo === 'dev') {
          this.router.navigate(['/dashboard-admin']);
        } else if (tipo === 'empleado') {
          this.router.navigate(['/dashboard']); 
        } else {
          // Fallback
          this.router.navigate(['/dashboard']);
        }
      },

      error: () => {
        this.error = 'Usuario y/o contraseña incorrectos';
      }
    });
  }

}

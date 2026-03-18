import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-miperfil',
  standalone: false,
  templateUrl: './miperfil.component.html',
  styleUrl: './miperfil.component.css'
})
export class MiperfilComponent {
  perfilForm!: FormGroup;
  modoEdicion: boolean = false;

  datosOriginales: {
    nombre: string;
    apellido: string;
    email: string;
    dni: string;
    telefono: string;
    direccion: string;
  } = {
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    direccion: ''
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('usuario');
    const usuario = userData ? JSON.parse(userData) : {};

    this.perfilForm = this.fb.group({
      nombre: [usuario.first_name || ''],
      apellido: [usuario.last_name || ''],
      email: [usuario.email || ''],
      dni: [usuario.dni || ''],
      telefono: [usuario.telefono || ''],
      direccion: [usuario.direccion || '']
    });

    this.datosOriginales = { ...this.perfilForm.value };
  }

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  activarEdicion() {
    this.modoEdicion = true;
    this.datosOriginales = { ...this.perfilForm.value };
  }

  guardarCambios() {
    if (this.perfilForm.valid) {
      const usuarioOriginal = localStorage.getItem('usuario');
      const datosCompletos = usuarioOriginal ? JSON.parse(usuarioOriginal) : null;

      if (!datosCompletos || !datosCompletos.id) {
        alert('No se pudo identificar al usuario.');
        return;
      }

      const datosActualizados = {
        ...datosCompletos,
        ...this.perfilForm.value
      };

      this.api.putUsuario(datosActualizados).subscribe({
        next: (res) => {
          localStorage.setItem('usuario', JSON.stringify(res));
          this.modoEdicion = false;
          alert('Perfil actualizado correctamente');
        },
        error: (err) => {
          console.error('Error al actualizar perfil:', err);
          alert('Error al actualizar el perfil');
        }
      });
    }
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.perfilForm.setValue(this.datosOriginales);
  }
}

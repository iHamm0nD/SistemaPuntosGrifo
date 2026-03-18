import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { Cita } from '../../models/cita.models';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  citas: any[] = [];
  especialidades: any[] = [];
  medicos: any[] = [];
  pacienteId: number | null = null;
  usuario: any;

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    const data = localStorage.getItem('usuario');
    if (data) this.usuario = JSON.parse(data);

    const id = localStorage.getItem('paciente_id');
    this.pacienteId = id ? Number(id) : null;

    // Cargar especialidades y médicos
    this.api.getEspecialidades().subscribe({
      next: (esp) => this.especialidades = esp,
      error: (err) => console.error('Error al cargar especialidades:', err)
    });

    this.api.getMedicos().subscribe({
      next: (meds) => this.medicos = meds,
      error: (err) => console.error('Error al cargar médicos:', err)
    });

    // Cargar citas del paciente
    if (this.pacienteId) {
      this.api.getCitas().subscribe({
        next: (data) => {
          const filtradas = data.filter(c => c.paciente === this.pacienteId);

          // Reemplazar ID por nombre
          this.citas = filtradas.map(c => {
            const esp = this.especialidades.find(e => e.id === c.especialidad);
            const med = this.medicos.find(m => m.id === c.medico);
            return {
              ...c,
              especialidadNombre: esp ? esp.nombre : 'Desconocido',
              medicoNombre: med ? `${med.usuario.nombre} ${med.usuario.apellido}` : 'Desconocido'
            };
          });
        },
        error: (err) => console.error('Error al obtener citas: ', err)
      });
    } else {
      console.warn('ID del paciente no disponible en localStorage');
    }
  }

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { Cita } from '../../models/cita.models';

@Component({
  selector: 'app-citasprogramadas',
  standalone: false,
  templateUrl: './citasprogramadas.component.html',
  styleUrl: './citasprogramadas.component.css'
})
export class CitasprogramadasComponent implements OnInit {
  mostrarCitas: boolean = false;
  citas: Cita[] = [];
  pacienteId: number | null = null;

  constructor(private api: ApiService) {}

  toggleCitas() {
    this.mostrarCitas = !this.mostrarCitas;
  }

  ngOnInit(): void {
    const id = localStorage.getItem('paciente_id');
    this.pacienteId = id ? Number(id) : null;

    if (this.pacienteId) {
      this.api.getCitas().subscribe({
        next: (data) => {
          // Filtra solo las citas del paciente actual
          this.citas = data.filter(c => c.paciente === this.pacienteId);
        },
        error: (err) => console.error('Error al obtener citas:', err)
      });
    } else {
      console.warn('ID del paciente no disponible en localStorage');
    }
  }
}

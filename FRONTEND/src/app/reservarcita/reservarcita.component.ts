import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-reservarcita',
  standalone: false,
  templateUrl: './reservarcita.component.html',
  styleUrls: ['./reservarcita.component.css']
})
export class ReservarCitaComponent implements OnInit {
  reservaForm!: FormGroup;

  especialidades: any[] = [];
  medicos: any[] = [];
  horasDisponibles: string[] = [];

  constructor(private fb: FormBuilder, private api: ApiService) {}

  ngOnInit(): void {
    this.api.getPacienteId().subscribe({
      next: (res) => {
        localStorage.setItem('paciente_id', res.paciente_id);
        console.log('ID del paciente:', res.paciente_id);
      },
      error: (err) => {
        console.error('No se pudo obtener el ID del paciente:', err);
      }
    });

    // Inicializa el formulario con validaciones
    this.reservaForm = this.fb.group({
      especialidad: ['', Validators.required],
      medico: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required]  // ✅ nuevo campo
    });

    this.obtenerEspecialidades();

    // ✅ Cargar horas disponibles al cambiar médico o fecha
    this.reservaForm.get('fecha')?.valueChanges.subscribe(() => {
      this.cargarHorasDisponibles();
    });
    this.reservaForm.get('medico')?.valueChanges.subscribe(() => {
      this.cargarHorasDisponibles();
    });
  }

  obtenerEspecialidades() {
    this.api.getEspecialidades().subscribe({
      next: (data) => this.especialidades = data,
      error: (err) => console.error('Error cargando especialidades:', err)
    });
  }

  onEspecialidadSeleccionada() {
    const id = this.reservaForm.get('especialidad')?.value;
    if (id) {
      this.api.getMedicos(id).subscribe({
        next: (data) => this.medicos = data,
        error: (err) => console.error('Error cargando médicos:', err)
      });
    }
  }

  // ✅ Cargar horas disponibles según médico y fecha
  cargarHorasDisponibles() {
    const fecha = this.reservaForm.get('fecha')?.value;
    const medicoId = this.reservaForm.get('medico')?.value;

    if (fecha && medicoId) {
      this.api.getHorasDisponibles(fecha, medicoId).subscribe({
        next: (res) => {
          this.horasDisponibles = res.horas || [];
          this.reservaForm.get('hora')?.setValue('');
        },
        error: (err) => {
          console.error('Error al obtener horas disponibles:', err);
          this.horasDisponibles = [];
        }
      });
    }
  }

  reservarCita() {
    if (this.reservaForm.valid) {
      const pacienteIdStr = localStorage.getItem('paciente_id');
      const pacienteId = pacienteIdStr ? Number(pacienteIdStr) : null;

      if (pacienteId === null || isNaN(pacienteId)) {
        alert('No se pudo identificar al paciente.');
        return;
      }

      const cita = {
        fecha: this.reservaForm.value.fecha,
        hora: this.reservaForm.value.hora, // ✅ usar hora seleccionada
        especialidad: this.reservaForm.value.especialidad,
        paciente: pacienteId,
        medico: this.reservaForm.value.medico
      };

      this.api.postCita(cita).subscribe({
        next: () => {
          alert('¡Cita reservada con éxito!');
          this.reservaForm.reset();
          this.medicos = [];
          this.horasDisponibles = [];
        },
        error: (err) => {
          console.error('Error al reservar cita:', err);
          alert('Ocurrió un error al reservar la cita.');
        }
      });
    }
  }
}
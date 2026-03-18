import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario.models';
import { ApiService } from '../../service/api.service';
import { Especialidad } from '../../models/especialidad.models';
import { Cita } from '../../models/cita.models';

interface Horario {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

@Component({
  selector: 'app-loginadmin',
  standalone: false,
  templateUrl: './loginadmin.component.html',
  styleUrl: './loginadmin.component.css'
})
export class LoginadminComponent implements OnInit {
  mostrarmodal: boolean = false;
  usuarioseleccionado: Usuario | null = null;
  editando: boolean = false;
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  filtroTipo: string = 'todos';
  esAdmin: boolean = false;

  diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sábado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  // ===== MÉDICO =====
  mostrarModalMedico: boolean = false;
  especialidades: Especialidad[] = [];
  citas: any[] = [];

  nuevoMedico: {
    usuario: {
      nombre: string;
      apellido: string;
      username: string;
      password: string;
      dni: string;
      email: string;
      telefono: string;
      tipo_usuario: string;
    };
    especialidad: number | null;
    horarios: Horario[];
  } = {
    usuario: {
      nombre: '',
      apellido: '',
      username: '',
      password: '',
      dni: '',
      email: '',
      telefono: '',
      tipo_usuario: 'medico'
    },
    especialidad: null,
    horarios: this.diasSemana.map(dia => ({
      dia_semana: dia.value,
      hora_inicio: '',
      hora_fin: ''
    }))
  };

  // ===== ESPECIALIDAD =====
  mostrarFormularioEspecialidad: boolean = false;
  nuevaEspecialidad: Especialidad = {
    id: 0,
    nombre: '',
    descripcion: ''
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private apiservice: ApiService
  ) {}

  ngOnInit(): void {
    const tipo = this.auth.getTipoUsuario();

    if (tipo === 'admin') {
      this.esAdmin = true;
      this.cargarUsuarios();
      this.apiservice.getEspecialidades().subscribe({
        next: data => this.especialidades = data,
        error: err => console.error('Error al cargar especialidades:', err)
      });
    } else {
      alert('No tienes permisos para acceder a esta página');
      this.router.navigate(['/login']);
    }
    this.cargarCitas();
  }

  cargarCitas() {
    this.apiservice.getCitas().subscribe({
      next: (data) => {
        this.citas = data;
      },
      error: (err) => {
        console.error("Error al cargar citas: ", err);
      }
    });
  }

  cargarUsuarios(): void {
    this.http.get<any[]>('http://127.0.0.1:8000/api/usuario/').subscribe({
      next: data => {
        this.usuarios = data;
        this.filtrarUsuarios();  // Aplicar filtro tras cargar
      },
      error: err => console.error('Error al cargar usuarios:', err)
    });
  }

  filtrarUsuarios() {
    if (this.filtroTipo === 'todos') {
      this.usuariosFiltrados = this.usuarios;
    } else {
      this.usuariosFiltrados = this.usuarios.filter(u => u.tipo_usuario === this.filtroTipo);
    }
  }

  verUsuario(usuario: any): void {
    this.usuarioseleccionado = usuario;
    this.mostrarmodal = true;
  }

  cerrarModal(): void {
    this.mostrarmodal = false;
    this.usuarioseleccionado = null;
  }

  habilitarEdicion() {
    this.editando = true;
  }

  cancelarEdicion() {
    this.editando = false;
  }

  guardarCambios() {
    if (this.usuarioseleccionado) {
      this.apiservice.putUsuario(this.usuarioseleccionado).subscribe({
        next: () => {
          this.editando = false;
          alert('Usuario actualizado correctamente');
        },
        error: () => {
          alert('Error al actualizar usuario');
        }
      });
    }
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.http.delete(`http://127.0.0.1:8000/api/usuario/${id}/`).subscribe({
        next: () => this.cargarUsuarios(),
        error: err => console.error('Error al eliminar:', err)
      });
    }
  }

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ========== MÉDICO ==========
  abrirModalMedico() {
    this.mostrarModalMedico = true;
  }

  cerrarModalMedico() {
    this.mostrarModalMedico = false;
    this.resetFormularioMedico();
  }

  resetFormularioMedico() {
    this.nuevoMedico = {
      usuario: {
        nombre: '',
        apellido: '',
        username: '',
        password: '',
        dni: '',
        email: '',
        telefono: '',
        tipo_usuario: 'medico'
      },
      especialidad: null,
      horarios: this.diasSemana.map(dia => ({
        dia_semana: dia.value,
        hora_inicio: '',
        hora_fin: ''
      }))
    };
  }

  registrarMedico() {
    const usuarioData = this.nuevoMedico.usuario;

    if (!usuarioData.username || !usuarioData.password || !this.nuevoMedico.especialidad) {
      alert('Completa los campos obligatorios');
      return;
    }

    this.apiservice.postUsuario(usuarioData).subscribe({
      next: (usuarioCreado) => {
        if (!usuarioCreado?.id) {
          alert("Error: El ID del usuario no está disponible.");
          return;
        }

        const medicoData = {
          usuario: usuarioCreado.id,
          especialidad: this.nuevoMedico.especialidad
        };

        this.apiservice.postMedico(medicoData).subscribe({
          next: (medicoCreado) => {
            const horariosValidos = this.nuevoMedico.horarios.filter(h =>
              h.hora_inicio && h.hora_fin && h.hora_inicio < h.hora_fin
            );

            horariosValidos.forEach(horario => {
              const horarioData = {
                medico: medicoCreado.id,
                dia_semana: horario.dia_semana,
                hora_inicio: horario.hora_inicio,
                hora_final: horario.hora_fin
              };
              this.apiservice.postHorario(horarioData).subscribe({
                error: err => console.error('Error al registrar horario:', err)
              });
            });

            alert('Médico y horarios registrados correctamente');
            this.cerrarModalMedico();
            this.cargarUsuarios();
          },
          error: () => alert('Error al registrar médico')
        });
      },
      error: () => alert('Error al registrar usuario')
    });
  }

  // ========== ESPECIALIDAD ==========
  registrarEspecialidad() {
    if (!this.nuevaEspecialidad.nombre || !this.nuevaEspecialidad.descripcion) {
      alert('Por favor, completa todos los campos');
      return;
    }

    this.apiservice.postEspecialidad(this.nuevaEspecialidad).subscribe({
      next: () => {
        alert('Especialidad registrada correctamente');
        this.mostrarFormularioEspecialidad = false;
        this.nuevaEspecialidad = { id: 0, nombre: '', descripcion: '' };
        this.apiservice.getEspecialidades().subscribe(data => this.especialidades = data);
      },
      error: () => alert('Error al registrar especialidad')
    });
  }

  cancelarEspecialidad() {
    this.mostrarFormularioEspecialidad = false;
    this.nuevaEspecialidad = { id: 0, nombre: '', descripcion: '' };
  }


}

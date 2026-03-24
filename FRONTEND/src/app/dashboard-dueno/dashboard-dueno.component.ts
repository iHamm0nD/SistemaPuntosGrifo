import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { TipoCombustible } from '../../models/combustible.models';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'app-dashboard-dueno',
  standalone: false,
  templateUrl: './dashboard-dueno.component.html',
  styleUrl: './dashboard-dueno.component.css'
})
export class DashboardDuenoComponent implements OnInit {

  usuario: any;
  totalClientes = 0;
  totalPuntos = 0;
  totalConsumos = 0;
  topClientes: any[] = [];
  consumoPorTipo: any[] = [];
  cargando = true;

  // Manejo de combustibles
  tiposCombustible: TipoCombustible[] = [];
  mostrarModalPrecios = false;
  guardandoPrecios = false;
  mensajeModal = '';
  tipoMensaje = 'success';

  // Paginación y búsqueda de registros
  registrosPaginados: any[] = [];
  paginaActual = 1;
  totalPaginas = 1;
  busquedaRegistro = '';
  cargandoRegistros = false;
  searchSubject: Subject<string> = new Subject<string>();

  // Gestión de Empleados
  mostrarModalEmpleados = false;
  mostrarModalAgregarEmpleado = false;
  mostrarResumenNuevoEmpleado = false;
  mostrarModalCredenciales = false;
  resumenEmpleadoConstruido: any = null;
  empCredencialesVisible: any = null;
  editandoPassword = false;
  nuevaPasswordEmp = '';
  mensajePasswordError = '';
  mensajePasswordOk = '';
  passwordMostrada = '';
  empleados: any[] = [];
  cargandoEmpleados = false;
  nuevoEmpleado: any = { username: '', password: '', nombre: '', apellido: '', dni: '', email: 'empleado@grifo.com', telefono: '', tipo_usuario: 'empleado' };

  // Ranking Modal
  mostrarModalRanking = false;
  todosClientes: any[] = [];
  cargandoRanking = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
    this.cargarDashboard();
    this.cargarRegistros(1);

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((valor) => {
      this.cargarRegistros(1);
    });
  }

  cargarDashboard(mostrarLoader: boolean = true) {
    if (mostrarLoader) {
      this.cargando = true;
    }
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.totalClientes = data.total_clientes;
        this.totalPuntos = data.total_puntos_otorgados;
        this.totalConsumos = data.total_consumos;
        this.topClientes = data.top_clientes;
        this.consumoPorTipo = data.consumo_por_tipo;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  getMedalColor(index: number): string {
    if (index === 0) return '#fbbf24';
    if (index === 1) return '#94a3b8';
    if (index === 2) return '#cd7f32';
    return '#475569';
  }

  getMedalIcon(index: number): string {
    if (index < 3) return 'pi pi-star-fill';
    return 'pi pi-star';
  }

  // ===== Gestión de Precios =====
  abrirModalPrecios() {
    this.mensajeModal = '';
    this.api.getTiposCombustible().subscribe({
      next: (data) => {
        this.tiposCombustible = data;
        this.mostrarModalPrecios = true;
      },
      error: () => {
        this.mostrarModalPrecios = true;
        this.mensajeModal = 'Error al cargar combustibles';
        this.tipoMensaje = 'error';
      }
    });
  }

  guardarPrecio(tipo: TipoCombustible) {
    this.guardandoPrecios = true;
    this.mensajeModal = '';
    
    this.api.putTipoCombustible(tipo.id, tipo).subscribe({
      next: (res) => {
        this.guardandoPrecios = false;
        this.mensajeModal = '¡Precio actualizado correctamente!';
        this.tipoMensaje = 'success';
        
        // Timeout para limpiar mensaje
        setTimeout(() => this.mensajeModal = '', 3000);
      },
      error: () => {
        this.guardandoPrecios = false;
        this.mensajeModal = 'Ups, ocurrió un error al guardar';
        this.tipoMensaje = 'error';
      }
    });
  }

  cerrarModalPrecios() {
    this.mostrarModalPrecios = false;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ===== Paginación de Registros =====
  cargarRegistros(page: number = 1) {
    this.cargandoRegistros = true;
    this.paginaActual = page;
    this.api.getRegistrosConsumo(page, this.busquedaRegistro).subscribe({
      next: (data) => {
        this.registrosPaginados = data.results || data;
        let count = data.count || this.registrosPaginados.length;
        this.totalPaginas = Math.ceil(count / 25) || 1;
        this.cargandoRegistros = false;
      },
      error: () => {
        this.cargandoRegistros = false;
        this.registrosPaginados = [];
      }
    });
  }

  buscarRegistros() {
    this.cargarRegistros(1);
  }

  onSearchChange(valor: string) {
    this.busquedaRegistro = valor;
    this.searchSubject.next(valor);
  }

  cambiarPagina(delta: number) {
    let nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.cargarRegistros(nuevaPagina);
    }
  }

  eliminarRegistro(id: number) {
    if (confirm('¿Estás seguro de eliminar este registro? Los puntos relacionados serán descontados del cliente.')) {
      this.api.deleteRegistroConsumo(id).subscribe({
        next: () => {
          this.cargarRegistros(this.paginaActual);
          this.cargarDashboard(false);
        },
        error: () => alert('Error al eliminar registro')
      });
    }
  }

  // ===== Ranking Completo =====
  abrirModalRanking() {
    this.mostrarModalRanking = true;
    this.cargandoRanking = true;
    this.api.getRankingClientes(100).subscribe({
      next: (data) => {
        this.todosClientes = data;
        this.cargandoRanking = false;
      },
      error: () => this.cargandoRanking = false
    });
  }

  cerrarModalRanking() {
    this.mostrarModalRanking = false;
  }

  // ===== Gestión de Empleados =====
  abrirModalAgregarEmpleado() {
    this.mostrarModalAgregarEmpleado = true;
    this.nuevoEmpleado = { username: '', password: '', nombre: '', apellido: '', dni: '', email: 'empleado@grifo.com', telefono: '', tipo_usuario: 'empleado' };
  }

  cerrarResumenEmpleado() {
    this.mostrarResumenNuevoEmpleado = false;
  }

  limpiarLetrasNombres() {
    this.nuevoEmpleado.nombre = this.nuevoEmpleado.nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.nuevoEmpleado.apellido = this.nuevoEmpleado.apellido.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  }

  abrirModalEmpleados() {
    this.mostrarModalEmpleados = true;
    this.cargarEmpleados();
  }

  cerrarModalEmpleados() {
    this.mostrarModalEmpleados = false;
  }

  cargarEmpleados() {
    this.cargandoEmpleados = true;
    this.api.getUsuariosPorTipo('empleado').subscribe({
      next: (data) => {
        this.empleados = data;
        this.cargandoEmpleados = false;
      },
      error: () => this.cargandoEmpleados = false
    });
  }

  limpiarDniEmpleado() {
    this.nuevoEmpleado.dni = this.nuevoEmpleado.dni.replace(/[^0-9]/g, '');
  }

  toggleCredenciales(emp: any) {
    this.empCredencialesVisible = emp;
    this.editandoPassword = false;
    this.nuevaPasswordEmp = '';
    this.mensajePasswordError = '';
    this.mensajePasswordOk = '';
    this.passwordMostrada = this.generarPasswordEmpleado(emp);
    this.mostrarModalCredenciales = true;
  }

  guardarNuevaPassword() {
    if (!this.nuevaPasswordEmp.trim()) {
      this.mensajePasswordError = 'La contraseña no puede estar vacía.';
      return;
    }
    this.mensajePasswordError = '';
    this.mensajePasswordOk = '';
    this.api.cambiarPasswordEmpleado(this.empCredencialesVisible.id, this.nuevaPasswordEmp).subscribe({
      next: () => {
        this.passwordMostrada = this.nuevaPasswordEmp;
        this.mensajePasswordOk = '✔ Contraseña actualizada correctamente.';
        this.editandoPassword = false;
        this.nuevaPasswordEmp = '';
        setTimeout(() => this.mensajePasswordOk = '', 4000);
      },
      error: () => {
        this.mensajePasswordError = 'Error al actualizar. Intenta de nuevo.';
      }
    });
  }

  generarPasswordEmpleado(emp: any): string {
    if (!emp.nombre || !emp.apellido || !emp.dni) return '—';
    const inicial = emp.nombre.charAt(0).toLowerCase();
    let apellido = emp.apellido.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
    const ultimos4 = emp.dni.slice(-4);
    return `${inicial}${apellido}${ultimos4}`;
  }

  guardarEmpleado() {
    if (!this.nuevoEmpleado.dni || !this.nuevoEmpleado.nombre || !this.nuevoEmpleado.apellido) {
      alert("Por favor, complete los campos obligatorios: Nombres, Apellidos y DNI.");
      return;
    }
    
    if (this.nuevoEmpleado.dni.length < 8 || this.nuevoEmpleado.dni.length > 9) {
      alert("El DNI debe tener 8 o 9 dígitos numéricos.");
      return;
    }

    if (/[^0-9]/.test(this.nuevoEmpleado.dni)) {
      alert("El DNI solo debe contener números.");
      return;
    }

    if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(this.nuevoEmpleado.nombre) || /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(this.nuevoEmpleado.apellido)) {
      alert("Nombres y Apellidos solo deben contener letras.");
      return;
    }

    this.nuevoEmpleado.nombre = this.nuevoEmpleado.nombre.trim().toUpperCase();
    this.nuevoEmpleado.apellido = this.nuevoEmpleado.apellido.trim().toUpperCase();
    this.nuevoEmpleado.username = this.nuevoEmpleado.dni;
    
    // Generate Password
    const primeraLetraNombre = this.nuevoEmpleado.nombre.charAt(0).toLowerCase();
    
    let apellidoLimpio = this.nuevoEmpleado.apellido.toLowerCase();
    apellidoLimpio = apellidoLimpio.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
    apellidoLimpio = apellidoLimpio.replace(/[^a-z]/g, ""); // Remove everything else like spaces
    
    const ultimos4DNI = this.nuevoEmpleado.dni.slice(-4);
    
    this.nuevoEmpleado.password = `${primeraLetraNombre}${apellidoLimpio}${ultimos4DNI}`;

    this.api.postUsuario(this.nuevoEmpleado).subscribe({
      next: () => {
        this.cargarEmpleados();
        this.resumenEmpleadoConstruido = { ...this.nuevoEmpleado };
        this.mostrarModalAgregarEmpleado = false;
        this.mostrarResumenNuevoEmpleado = true;
        this.nuevoEmpleado = { username: '', password: '', nombre: '', apellido: '', dni: '', email: 'empleado@grifo.com', telefono: '', tipo_usuario: 'empleado' };
      },
      error: (err) => {
        alert('Error al crear empleado. Verifique si el DNI ya existe.');
      }
    });
  }

  eliminarEmpleado(id: string) {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      this.api.deleteUsuario(id).subscribe({
        next: () => this.cargarEmpleados(),
        error: () => alert('Error al eliminar empleado')
      });
    }
  }
}

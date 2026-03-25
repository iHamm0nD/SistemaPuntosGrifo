import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { TipoCombustible } from '../../models/combustible.models';

@Component({
  selector: 'app-dashboard-empleado',
  standalone: false,
  templateUrl: './dashboard-empleado.component.html',
  styleUrl: './dashboard-empleado.component.css'
})
export class DashboardEmpleadoComponent implements OnInit {

  // Datos del formulario
  dni = '';
  nombres = '';
  apellidos = '';
  monto: number | null = null;
  tipoCombustibleId: number | null = null;

  // Datos del sistema
  tiposCombustible: TipoCombustible[] = [];
  usuario: any;

  // Estado del modal de confirmación
  mostrarConfirmacion = false;
  combustibleSeleccionado: TipoCombustible | null = null;
  puntosEstimados = 0;
  galonesEstimados = 0;

  // Estado del resultado
  mostrarResultado = false;
  resultadoRegistro: any = null;

  // Mensajes
  error = '';
  cargando = false;

  fechaActual: Date = new Date();
  intentoSubmit = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
    this.cargarCombustibles();
  }

  cargarCombustibles() {
    this.api.getTiposCombustible().subscribe({
      next: (data) => {
        this.tiposCombustible = data;
      },
      error: () => {
        this.error = 'Error al cargar tipos de combustible';
      }
    });
  }

  // Estado para la búsqueda externa de DNI
  buscandoDni = false;
  errorDni = '';

  buscarCliente() {
    this.nombres = '';
    this.apellidos = '';
    this.errorDni = '';
    
    // Buscar tanto para 8 (DNI) como para 9 (Carnet de extranjería) dígitos
    if (this.dni.length >= 8 && this.dni.length <= 9) {
      if (/[^0-9]/.test(this.dni)) return;
      
      this.api.buscarClientePorDni(this.dni).subscribe({
        next: (cliente) => {
          this.nombres = cliente.nombres;
          this.apellidos = cliente.apellidos;
        },
        error: () => {
          // Cliente no encontrado en bd local. 
          // Solo buscamos en RENIEC (API Externa) si es DNI (8 dígitos)
          if (this.dni.length === 8) {
            this.buscandoDni = true;
            this.errorDni = '';
            this.api.consultarDNI(this.dni).subscribe({
              next: (res) => {
                this.buscandoDni = false;
                if (res && res.nombres) {
                  this.nombres = res.nombres;
                  this.apellidos = `${res.apellidoPaterno} ${res.apellidoMaterno}`;
                } else if (res && res.nombre) {
                  this.nombres = res.nombre;
                  this.apellidos = res.apellido || '';
                } else {
                  this.errorDni = res.message || 'DNI no encontrado en RENIEC.';
                }
              },
              error: (err) => {
                this.buscandoDni = false;
                if (err.status === 401 || err.status === 403) {
                   this.errorDni = 'Falta o es inválido el Token de la API.';
                } else {
                   this.errorDni = 'No se pudo consultar el DNI.';
                }
              }
            });
          }
        }
      });
    }
  }

  abrirConfirmacion() {
    this.error = '';
    this.intentoSubmit = true;

    if (!this.dni || !this.nombres || !this.apellidos || !this.tipoCombustibleId || !this.monto) {
      return;
    }

    if (this.dni.length < 8 || this.dni.length > 9) {
      return;
    }

    if (this.dni && /[^0-9]/.test(this.dni)) {
      return;
    }

    this.nombres = this.nombres.trim().toUpperCase();
    this.apellidos = this.apellidos.trim().toUpperCase();

    if (this.monto !== null && this.monto <= 0) {
      return;
    }

    this.combustibleSeleccionado = this.tiposCombustible.find(
      c => c.id === this.tipoCombustibleId
    ) || null;

    if (this.combustibleSeleccionado) {
      this.galonesEstimados = this.monto / this.combustibleSeleccionado.precio_referencial;
      this.puntosEstimados = Math.floor(this.galonesEstimados) * this.combustibleSeleccionado.puntos_por_galon;
    }

    this.mostrarConfirmacion = true;
  }

  cancelarConfirmacion() {
    this.mostrarConfirmacion = false;
  }

  confirmarRegistro() {
    this.cargando = true;
    this.mostrarConfirmacion = false;

    this.api.registrarConsumo({
      dni: this.dni,
      nombres: this.nombres,
      apellidos: this.apellidos,
      tipo_combustible: this.tipoCombustibleId!,
      monto_consumido: this.monto!
    }).subscribe({
      next: (res) => {
        this.cargando = false;
        this.fechaActual = new Date();
        this.resultadoRegistro = res.detalle;
        this.mostrarResultado = true;
        this.limpiarFormulario();
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.error || 'Error al registrar consumo';
      }
    });
  }

  cerrarResultado() {
    this.mostrarResultado = false;
    this.resultadoRegistro = null;
  }

  limpiarFormulario() {
    this.intentoSubmit = false;
    this.dni = '';
    this.nombres = '';
    this.apellidos = '';
    this.monto = null;
    this.tipoCombustibleId = null;
    this.error = '';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

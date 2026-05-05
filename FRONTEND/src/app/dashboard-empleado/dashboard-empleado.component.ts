import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { MessageService } from 'primeng/api';
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
  nroBoleta = '';

  // Datos del sistema
  tiposCombustible: TipoCombustible[] = [];
  usuario: any;
  tanqueLleno: boolean = false;

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
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
    this.cargarCombustibles();
  }

  cargarCombustibles() {
    this.api.getTiposCombustible().subscribe({
      next: (data) => {
        // Filtramos para que no aparezca "Canje de Puntos" u opciones similares en el registro de consumo
        this.tiposCombustible = data.filter(t => !t.nombre.toLowerCase().includes('canje'));
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

    if (!this.dni || !this.nombres || !this.apellidos || !this.tipoCombustibleId || !this.monto || !this.nroBoleta?.trim()) {
      return;
    }

    if (this.dni.length < 8 || this.dni.length > 9) {
      return;
    }

    if (this.dni && /[^0-9]/.test(this.dni)) {
      return;
    }

    if (this.nroBoleta && !['B', 'F', 'T'].includes(this.nroBoleta.trim().toUpperCase()[0])) {
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
      let isPremium = this.combustibleSeleccionado.nombre.toLowerCase().includes('premium');
      let ratio = isPremium ? 2.5 : 2;
      let tramosDe10 = Math.floor(this.monto / 10);
      let puntos = tramosDe10 * ratio;
      if (this.tanqueLleno) {
        puntos += 2;
      }
      this.puntosEstimados = parseFloat(puntos.toFixed(2));
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
      nro_boleta: this.nroBoleta.trim().toUpperCase(),
      dni: this.dni,
      nombres: this.nombres,
      apellidos: this.apellidos,
      tipo_combustible: this.tipoCombustibleId!,
      monto_consumido: this.monto!,
      tanque_lleno: this.tanqueLleno
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
        // Extraer error de nro_boleta duplicado u otro error del backend
        const errData = err.error;
        if (errData?.nro_boleta) {
          this.error = errData.nro_boleta[0];
        } else {
          this.error = errData?.error || errData?.detail || 'Error al registrar consumo';
        }
      }
    });
  }

  cerrarResultado() {
    // Mostrar notificación tipo Toast al cerrar el modal de éxito
    if (this.resultadoRegistro) {
      this.messageService.add({
        severity: 'success',
        summary: '¡Éxito!',
        detail: 'Consumo registrado correctamente',
        life: 3000
      });
    }
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
    this.tanqueLleno = false;
    this.nroBoleta = '';
    this.error = '';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  imprimirTicket() {
    if (!this.resultadoRegistro) return;

    // Formatear la fecha
    const fechaFormat = this.fechaActual.toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const result = this.resultadoRegistro;

    // Generar la plantilla HTML pura con estilos incrustados
    const printContent = `
      <html>
        <head>
          <title>Imprimir Ticket</title>
          <style>
            @page { margin: 0; size: 58mm auto; }
            body { 
              font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; 
              width: 54mm; /* Damos 54mm efectivos para los bordes del rollo */
              margin: 0; 
              padding: 2mm; 
              color: black;
            }
            p { margin: 0; }
            .header {
              text-align: center;
              margin-bottom: 8px;
              border-bottom: 1px dashed black;
              padding-bottom: 6px;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
            }
            .subtitle {
              font-size: 11px;
              margin-top: 3px;
            }
            .row {
              padding: 4px 0;
              margin: 0;
              border-bottom: 1px dashed black;
            }
            .label {
              font-size: 11px;
              font-weight: normal;
              text-transform: uppercase;
              margin-right: 4px;
            }
            .value {
              font-weight: bold;
              font-size: 12px;
            }
            .totals {
              margin-top: 6px;
            }
            .totals .row {
              border-bottom: none;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              margin-top: 10px;
              border-top: 1px dashed black;
              padding-top: 8px;
              margin-bottom: 15px; /* Espacio extra para asegurar el corte del papel */
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">GRIFO LA PERRICHOLI</p>
            <p class="subtitle">Ticket de Puntos</p>
            <p class="subtitle">${fechaFormat}</p>
          </div>
        
          <div class="row">
            <span class="label">Cliente:</span>
            <span class="value">${result.cliente}</span>
          </div>
          <div class="row">
            <span class="label">DNI / CE:</span>
            <span class="value">${result.dni}</span>
          </div>
          <div class="row">
            <span class="label">Combustible:</span>
            <span class="value">${result.combustible}</span>
          </div>
          <div class="row">
            <span class="label">Monto Total:</span>
            <span class="value">S/. ${parseFloat(result.monto_total).toFixed(2)}</span>
          </div>
          
          <div class="totals">
            <div class="row">
              <span class="label">Puntos Otorgados:</span>
              <span class="value" style="font-size: 14px">+${result.puntos_otorgados} pts</span>
            </div>
            <div class="row">
              <span class="label">Puntos Acumulados:</span>
              <span class="value">${result.puntos_acumulados} pts</span>
            </div>
          </div>
          
          <div class="footer">
            <p>¡Gracias por su consumo!</p>
          </div>
        </body>
      </html>
    `;

    // Crear un iframe invisible para no alterar el DOM actual
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Escribir el contenido en el iframe e imprimir
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(printContent);
    iframe.contentWindow?.document.close();
    iframe.contentWindow?.focus();

    // Le damos algo de tiempo para renderizar en el iframe
    setTimeout(() => {
      iframe.contentWindow?.print();

      // Limpiar y destruir el iframe después
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);

    }, 250);
  }
}

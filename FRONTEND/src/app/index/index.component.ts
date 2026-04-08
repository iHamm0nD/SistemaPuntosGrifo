import { Component, OnDestroy } from '@angular/core';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-index',
  standalone: false,
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent implements OnDestroy {
  mostrarModalPuntos: boolean = false;
  dniConsulta: string = '';
  puntosCliente: number | null = null;
  nombreCliente: string = '';
  mensajeError: string = '';
  cargando: boolean = false;
  ultimoDniConsultado: string = '';
  enCooldown: boolean = false;
  segundosCooldown: number = 0;
  intervaloCooldown: any;

  constructor(private apiService: ApiService) {}

  abrirModalConsultarPuntos() {
    this.mostrarModalPuntos = true;
    this.resetearConsulta();
  }

  resetearConsulta() {
    this.dniConsulta = '';
    this.puntosCliente = null;
    this.nombreCliente = '';
    this.mensajeError = '';
    this.ultimoDniConsultado = '';
  }

  consultarPuntos() {
    if (this.cargando || this.enCooldown) {
      return;
    }

    if (!this.dniConsulta || this.dniConsulta.length !== 8) {
      this.mensajeError = 'Ingrese un DNI válido de 8 dígitos.';
      return;
    }

    // Evita volver a buscar si es exactamente el mismo DNI y ya tenemos el resultado exitoso
    if (this.dniConsulta === this.ultimoDniConsultado && this.puntosCliente !== null) {
      this.mensajeError = 'Ya estás visualizando los puntos de este DNI.';
      return;
    }

    this.cargando = true;
    this.mensajeError = '';
    
    this.apiService.buscarClientePorDni(this.dniConsulta).subscribe({
      next: (cliente) => {
        this.puntosCliente = cliente.puntos_acumulados;
        this.nombreCliente = `${cliente.nombres} ${cliente.apellidos}`;
        this.ultimoDniConsultado = this.dniConsulta;
        this.cargando = false;
        this.iniciarCooldown();
      },
      error: (err) => {
        if (err.status === 404) {
          this.mensajeError = 'No se encontró un cliente con este DNI.';
        } else {
          this.mensajeError = 'Error al consultar los puntos. Intente de nuevo.';
        }
        this.ultimoDniConsultado = this.dniConsulta;
        this.cargando = false;
        this.puntosCliente = null;
        this.nombreCliente = '';
        this.iniciarCooldown();
      }
    });
  }

  iniciarCooldown() {
    this.enCooldown = true;
    this.segundosCooldown = 5;
    this.intervaloCooldown = setInterval(() => {
      this.segundosCooldown--;
      if (this.segundosCooldown <= 0) {
        this.enCooldown = false;
        clearInterval(this.intervaloCooldown);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervaloCooldown) {
      clearInterval(this.intervaloCooldown);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../service/api.service';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { TipoCombustible } from '../../models/combustible.models';
import { forkJoin } from 'rxjs';
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
  ultimosRegistros: any[] = [];
  cargando = true;

  // Manejo de combustibles
  tiposCombustible: TipoCombustible[] = [];
  mostrarModalPrecios = false;
  guardandoPrecios = false;
  mensajeModal = '';
  tipoMensaje = 'success';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.cargando = true;
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.totalClientes = data.total_clientes;
        this.totalPuntos = data.total_puntos_otorgados;
        this.totalConsumos = data.total_consumos;
        this.topClientes = data.top_clientes;
        this.consumoPorTipo = data.consumo_por_tipo;
        this.ultimosRegistros = data.ultimos_registros;
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
}

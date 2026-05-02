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
  menuAbierto = false;
  totalClientes = 0;
  totalPuntos = 0;
  totalConsumos = 0;
  topClientes: any[] = [];
  consumoPorTipo: any[] = [];
  cargando = true;
  filtroPeriodo: string = 'dia'; // dia, semana, mes, total
  cargandoConsumo = false;

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
  mostrarModalEditarEmpleado = false;
  resumenEmpleadoConstruido: any = null;
  empCredencialesVisible: any = null;
  empleadoEditando: any = null;
  errorEdicionEmpleado = '';
  okEdicionEmpleado = '';
  editandoPassword = false;
  nuevaPasswordEmp = '';
  mensajePasswordError = '';
  mensajePasswordOk = '';
  passwordMostrada = '';
  empleados: any[] = [];
  cargandoEmpleados = false;
  buscandoDni = false;
  errorDni = '';
  nuevoEmpleado: any = { username: '', password: '', nombre: '', apellido: '', dni: '', email: 'empleado@grifo.com', telefono: '', tipo_usuario: 'empleado' };

  // Ranking Modal
  mostrarModalRanking = false;
  todosClientes: any[] = [];
  cargandoRanking = false;

  // Canje de Puntos
  mostrarModalCanjearPuntos = false;
  canjeDni = '';
  canjePuntos: number | null = null;
  canjeClienteEncontrado: any = null;
  canjeErrorDni = '';
  canjeMensajeOk = '';
  canjeMensajeError = '';
  canjeando = false;

  // Toast de resultado de canje
  mostrarToastCanje = false;
  toastMensaje = '';
  toastTipo: 'ok' | 'error' = 'ok';

  // Productos para el modal de canje
  productosParaCanje: any[] = [];
  productoSeleccionadoCanje: any | null = null;
  mostrarProductosCanje = false;
  cargandoProductosCanje = false;

  // Configuración — Productos Destacados
  mostrarModalConfiguracion = false;
  productosConfig: any[] = [];
  cargandoConfig = false;
  guardandoConfig = false;
  configMensajeOk = '';
  configMensajeError = '';
  idsDestacados: Set<number> = new Set();

  // Verificación de credenciales extra
  mostrarModalVerificarPassword = false;
  verificandoPassword = false;
  passwordVerificacion = '';
  errorVerificacion = '';
  mensajeVerificacion = '';
  accionProtegidaPendiente: Function | null = null;

  // Productos Canjeables
  mostrarModalProductos = false;
  productosLista: any[] = [];
  nuevoProducto: any = { nombre: '', descripcion: '', puntos_requeridos: null, stock: 0, categoria: 'General' };
  imagenSeleccionada: File | null = null;
  guardandoProducto = false;
  productoEditando: any = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  solicitarVerificacionPassword(accion: Function, mensaje: string = 'Por seguridad, ingrese su contraseña para continuar.') {
    this.accionProtegidaPendiente = accion;
    this.mensajeVerificacion = mensaje;
    this.passwordVerificacion = '';
    this.errorVerificacion = '';
    this.mostrarModalVerificarPassword = true;
  }

  confirmarPassword() {
    if (!this.passwordVerificacion) return;
    this.verificandoPassword = true;
    this.errorVerificacion = '';
    this.api.validarPassword(this.passwordVerificacion).subscribe({
      next: () => {
        this.verificandoPassword = false;
        this.mostrarModalVerificarPassword = false;
        if (this.accionProtegidaPendiente) {
          this.accionProtegidaPendiente();
          this.accionProtegidaPendiente = null;
        }
      },
      error: (err) => {
        this.verificandoPassword = false;
        if (err.status === 401) {
            this.errorVerificacion = 'Contraseña incorrecta.';
        } else {
            this.errorVerificacion = 'Hubo un error del servidor. Inténtelo más tarde.';
        }
      }
    });
  }

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
    this.api.getDashboard(this.filtroPeriodo).subscribe({
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

  cambiarFiltroPeriodo(periodo: string) {
    this.filtroPeriodo = periodo;
    this.cargandoConsumo = true;
    this.api.getDashboard(periodo).subscribe({
      next: (data) => {
        this.consumoPorTipo = data.consumo_por_tipo;
        this.cargandoConsumo = false;
      },
      error: () => {
        this.cargandoConsumo = false;
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
    this.solicitarVerificacionPassword(() => {
      this.api.deleteRegistroConsumo(id).subscribe({
        next: () => {
          this.cargarRegistros(this.paginaActual);
          this.cargarDashboard(false);
        },
        error: () => alert('Error al eliminar registro')
      });
    }, 'Por favor ingrese su contraseña para confirmar la eliminación de este registro y restaurar los puntos de dicho consumo.');
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
    this.errorDni = '';
    
    if (this.nuevoEmpleado.dni.length === 8) {
      this.buscarDniEnApi();
    }
  }

  buscarDniEnApi() {
    this.buscandoDni = true;
    this.errorDni = '';
    this.api.consultarDNI(this.nuevoEmpleado.dni).subscribe({
      next: (res) => {
        if (res && res.nombres) {
          this.nuevoEmpleado.nombre = res.nombres;
          this.nuevoEmpleado.apellido = `${res.apellidoPaterno} ${res.apellidoMaterno}`;
        } else if (res && res.nombre) {
          // Algunos endpoints devuelven {nombre: ...}
          this.nuevoEmpleado.nombre = res.nombre;
          this.nuevoEmpleado.apellido = res.apellido || '';
        } else {
          this.errorDni = res.message || 'DNI no encontrado en RENIEC.';
        }
        this.buscandoDni = false;
      },
      error: (err) => {
        this.buscandoDni = false;
        // Solo mostramos error si el status no es 0 (que indica un problema de CORS o conexión si no hay token aún)
        if (err.status === 401 || err.status === 403) {
           this.errorDni = 'Falta o es inválido el Token de la API.';
        } else {
           this.errorDni = 'No se pudo consultar el DNI.';
        }
      }
    });
  }

  toggleCredenciales(emp: any) {
    this.solicitarVerificacionPassword(() => {
        this.empCredencialesVisible = emp;
        this.editandoPassword = false;
        this.nuevaPasswordEmp = '';
        this.mensajePasswordError = '';
        this.mensajePasswordOk = '';
        this.passwordMostrada = this.generarPasswordEmpleado(emp);
        this.mostrarModalCredenciales = true;
    }, 'Se requiere su contraseña maestra para poder ver o editar credenciales de otros empleados.');
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

  abrirEdicionEmpleado(emp: any) {
    // Copia profunda para no mutar la lista mientras se edita
    this.empleadoEditando = { ...emp };
    this.errorEdicionEmpleado = '';
    this.okEdicionEmpleado = '';
    this.mostrarModalEditarEmpleado = true;
  }

  limpiarDniEdicion() {
    this.empleadoEditando.dni = this.empleadoEditando.dni.replace(/[^0-9]/g, '');
  }

  limpiarLetrasEdicion() {
    this.empleadoEditando.nombre = this.empleadoEditando.nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.empleadoEditando.apellido = this.empleadoEditando.apellido.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  }

  guardarEdicionEmpleado() {
    this.errorEdicionEmpleado = '';
    this.okEdicionEmpleado = '';

    if (!this.empleadoEditando.dni || !this.empleadoEditando.nombre || !this.empleadoEditando.apellido) {
      this.errorEdicionEmpleado = 'DNI, Nombres y Apellidos son obligatorios.';
      return;
    }
    if (this.empleadoEditando.dni.length < 8 || this.empleadoEditando.dni.length > 9) {
      this.errorEdicionEmpleado = 'El DNI debe tener 8 o 9 dígitos.';
      return;
    }

    this.empleadoEditando.nombre = this.empleadoEditando.nombre.trim().toUpperCase();
    this.empleadoEditando.apellido = this.empleadoEditando.apellido.trim().toUpperCase();
    // El username (login) siempre es el DNI
    this.empleadoEditando.username = this.empleadoEditando.dni;

    this.solicitarVerificacionPassword(() => {
        this.api.putUsuario(this.empleadoEditando).subscribe({
          next: () => {
            this.okEdicionEmpleado = '✔ Datos actualizados correctamente.';
            this.cargarEmpleados();
            setTimeout(() => {
              this.okEdicionEmpleado = '';
              this.mostrarModalEditarEmpleado = false;
            }, 1500);
          },
          error: () => {
            this.errorEdicionEmpleado = 'Error al guardar. Verifica que el DNI no esté en uso por otro empleado.';
          }
        });
    }, 'Ingrese su contraseña para confirmar y guardar la modificación de los datos de este empleado.');
  }

  eliminarEmpleado(id: string) {
    this.solicitarVerificacionPassword(() => {
        this.api.deleteUsuario(id).subscribe({
          next: () => this.cargarEmpleados(),
          error: () => alert('Error al eliminar empleado')
        });
    }, 'Aviso: Ingrese su contraseña para confirmar y ejecutar la eliminación permanente de esta cuenta.');
  }

  // ===== Canje de Puntos =====
  abrirModalCanjearPuntos() {
    this.limpiarModalCanje();
    this.mostrarModalCanjearPuntos = true;
    this.cargandoProductosCanje = true;
    this.api.getProductos().subscribe({
      next: (data) => {
        this.productosParaCanje = data;
        this.cargandoProductosCanje = false;
      },
      error: () => { this.cargandoProductosCanje = false; }
    });
  }

  limpiarModalCanje() {
    this.canjeDni = '';
    this.canjePuntos = null;
    this.canjeClienteEncontrado = null;
    this.canjeErrorDni = '';
    this.canjeMensajeOk = '';
    this.canjeMensajeError = '';
    this.canjeando = false;
    this.productoSeleccionadoCanje = null;
    this.mostrarProductosCanje = false;
  }

  onCanjeDniChange() {
    this.canjeClienteEncontrado = null;
    this.canjeErrorDni = '';
    this.canjeMensajeOk = '';
    this.canjeMensajeError = '';

    const dni = this.canjeDni.replace(/[^0-9]/g, '');
    this.canjeDni = dni;

    if (dni.length >= 8 && dni.length <= 9) {
      this.api.buscarClientePorDni(dni).subscribe({
        next: (cliente: any) => {
          if (cliente && parseFloat(cliente.puntos_acumulados) > 0) {
            this.canjeClienteEncontrado = cliente;
            this.canjeErrorDni = '';
          } else if (cliente) {
            this.canjeErrorDni = 'El cliente aún no hizo consumos o no tiene puntos disponibles.';
          }
        },
        error: () => {
          this.canjeErrorDni = 'Este cliente no tiene consumos registrados en el sistema.';
        }
      });
    }
  }

  seleccionarProductoCanje(prod: any) {
    if (this.productoSeleccionadoCanje?.id === prod.id) {
      // Deseleccionar si ya estaba seleccionado
      this.productoSeleccionadoCanje = null;
      this.canjePuntos = null;
    } else {
      this.productoSeleccionadoCanje = prod;
      this.canjePuntos = prod.puntos_requeridos;
    }
    this.canjeMensajeError = '';
  }

  ejecutarCanje() {
    if (!this.canjeClienteEncontrado || !this.productoSeleccionadoCanje) return;
    this.canjeando = true;
    this.canjeMensajeOk = '';
    this.canjeMensajeError = '';
    const puntos = this.productoSeleccionadoCanje.puntos_requeridos;
    const productoId = this.productoSeleccionadoCanje.id;

    this.api.canjearPuntos(this.canjeDni, puntos, productoId).subscribe({
      next: (res: any) => {
        this.canjeando = false;
        this.mostrarModalCanjearPuntos = false;
        this.limpiarModalCanje();
        this.cargarDashboard(false);
        this.toastMensaje = `${res.mensaje} Puntos restantes: ${res.puntos_restantes}`;
        this.toastTipo = 'ok';
        this.mostrarToastCanje = true;
        setTimeout(() => this.mostrarToastCanje = false, 15000);
      },
      error: (err: any) => {
        this.canjeando = false;
        this.canjeMensajeError = err.error?.error || 'Error al procesar el canje.';
      }
    });
  }

  // ===== Gestión de Productos Canjeables =====
  abrirModalProductos() {
    this.mostrarModalProductos = true;
    this.cargarProductos();
    this.limpiarFormProducto();
  }

  cargarProductos() {
    this.api.getProductos().subscribe({
      next: (data) => this.productosLista = data,
      error: () => this.productosLista = []
    });
  }

  limpiarFormProducto() {
    this.nuevoProducto = { nombre: '', descripcion: '', puntos_requeridos: null, stock: 0, categoria: 'General' };
    this.imagenSeleccionada = null;
    this.productoEditando = null;
  }

  onImagenSeleccionada(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
    }
  }

  guardarProducto() {
    if (!this.nuevoProducto.nombre || !this.nuevoProducto.puntos_requeridos) return;
    this.guardandoProducto = true;

    const formData = new FormData();
    formData.append('nombre', this.nuevoProducto.nombre);
    formData.append('descripcion', this.nuevoProducto.descripcion || '');
    formData.append('puntos_requeridos', this.nuevoProducto.puntos_requeridos.toString());
    formData.append('categoria', this.nuevoProducto.categoria || 'General');
    formData.append('stock', (this.nuevoProducto.stock ?? 0).toString());
    formData.append('activo', 'true'); // Explicitly set to true to ensure it shows publicly
    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    if (this.productoEditando) {
      this.api.putProducto(this.productoEditando.id, formData).subscribe({
        next: () => {
          this.guardandoProducto = false;
          this.cargarProductos();
          this.limpiarFormProducto();
        },
        error: (err) => {
          this.guardandoProducto = false;
          const msg = err.error ? JSON.stringify(err.error) : 'Error desconocido';
          alert('Error al actualizar el producto: ' + msg);
        }
      });
    } else {
      this.api.postProducto(formData).subscribe({
        next: () => {
          this.guardandoProducto = false;
          this.cargarProductos();
          this.limpiarFormProducto();
        },
        error: (err) => {
          this.guardandoProducto = false;
          const msg = err.error ? JSON.stringify(err.error) : 'Error desconocido';
          alert('Error al crear el producto: ' + msg);
        }
      });
    }
  }

  editarProducto(prod: any) {
    this.productoEditando = prod;
    this.nuevoProducto = {
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      puntos_requeridos: prod.puntos_requeridos,
      stock: prod.stock ?? 0,
      categoria: prod.categoria
    };
    this.imagenSeleccionada = null;
  }

  cancelarEdicionProducto() {
    this.limpiarFormProducto();
  }

  eliminarProducto(id: number) {
    this.solicitarVerificacionPassword(() => {
      this.api.deleteProducto(id).subscribe({
        next: () => this.cargarProductos(),
        error: () => alert('Error al eliminar el producto.')
      });
    }, 'Ingrese su contraseña para confirmar la eliminación de este producto.');
  }

  // ─── Configuración de Destacados ───
  abrirModalConfiguracion() {
    this.mostrarModalConfiguracion = true;
    this.configMensajeOk = '';
    this.configMensajeError = '';
    this.cargandoConfig = true;
    this.api.getProductos().subscribe({
      next: (data) => {
        this.productosConfig = data;
        this.idsDestacados = new Set(data.filter((p: any) => p.destacado).map((p: any) => p.id));
        this.cargandoConfig = false;
      },
      error: () => { this.cargandoConfig = false; }
    });
  }

  toggleDestacado(id: number) {
    if (this.idsDestacados.has(id)) {
      this.idsDestacados.delete(id);
    } else {
      if (this.idsDestacados.size >= 6) {
        this.configMensajeError = 'Máximo 6 productos destacados permitidos.';
        return;
      }
      this.idsDestacados.add(id);
    }
    this.configMensajeError = '';
  }

  guardarDestacados() {
    const ids = Array.from(this.idsDestacados);
    if (ids.length < 4 || ids.length > 6) {
      this.configMensajeError = 'Debes seleccionar entre 4 y 6 productos destacados.';
      return;
    }
    this.guardandoConfig = true;
    this.configMensajeOk = '';
    this.configMensajeError = '';
    this.api.setDestacados(ids).subscribe({
      next: (res: any) => {
        this.guardandoConfig = false;
        this.configMensajeOk = res.mensaje || 'Destacados guardados correctamente.';
        setTimeout(() => this.configMensajeOk = '', 3000);
      },
      error: (err: any) => {
        this.guardandoConfig = false;
        this.configMensajeError = err.error?.error || 'Error al guardar.';
      }
    });
  }
}

import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../service/api.service';

interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
  image: string;
  category: string;
  stock: number;
}

@Component({
  selector: 'app-index',
  standalone: false,
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent implements OnInit, AfterViewInit, OnDestroy {
  // Points consultation
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

  // Catalog
  catalogProducts: CatalogProduct[] = [];
  allProducts: CatalogProduct[] = [];
  loopedProducts: CatalogProduct[] = [];
  selectedProduct: CatalogProduct | null = null;
  mostrarDialogoRedencion: boolean = false;
  puntosActuales: number = 0;
  verTodos: boolean = false;
  currentYear = new Date().getFullYear();

  faqs = [
    {
      question: '¿Cómo acumulo puntos en Grifo La Perricholi?',
      answer: 'Cada vez que cargues combustible en nuestro grifo, el empleado registra tu compra con tu DNI. Los puntos se calculan automáticamente según el monto de tu boleta o factura.',
      open: false
    },
    {
      question: '¿Mis puntos tienen fecha de expiración?',
      answer: 'Actualmente los puntos no tienen fecha de vencimiento. Puedes acumularlos con calma y canjearlos cuando quieras por los productos disponibles en el catálogo.',
      open: false
    },
    {
      question: '¿Cómo puedo canjear mis puntos?',
      answer: 'Consulta tus puntos ingresando tu DNI en el botón "Consultar mis puntos". Luego elige el producto que deseas canjear del catálogo y presiona el botón "Canjear". Un empleado gestionará el canje en tienda.',
      open: false
    },
    {
      question: '¿Cómo consulto mis puntos acumulados?',
      answer: 'Haz clic en el botón "Consultar mis puntos" ubicado en la parte superior de la página, ingresa tu número de DNI de 8 dígitos y podrás ver tu saldo de puntos al instante.',
      open: false
    }
  ];

  // Carousel
  @ViewChild('carouselTrack') carouselTrack!: ElementRef<HTMLDivElement>;
  private isDragging = false;
  private dragStartX = 0;
  private scrollStartX = 0;
  private readonly GAP_PX = 24; // 1.5rem gap

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.cargarProductosCatalogo();
  }

  cargarProductosCatalogo(): void {
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        this.allProducts = productos.map((p: any) => ({
          id: p.id,
          name: p.nombre,
          description: p.descripcion,
          pointsRequired: p.puntos_requeridos,
          image: p.imagen_url || 'assets/images/placeholder.png',
          category: p.categoria || 'General',
          stock: p.stock ?? 0
        }));

        const destacados = productos.filter((p: any) => p.destacado);
        this.catalogProducts = destacados.map((p: any) => ({
          id: p.id,
          name: p.nombre,
          description: p.descripcion,
          pointsRequired: p.puntos_requeridos,
          image: p.imagen_url || 'assets/images/placeholder.png',
          category: p.categoria || 'General',
          stock: p.stock ?? 0
        }));
        this.loopedProducts = [
          ...this.catalogProducts,
          ...this.catalogProducts,
          ...this.catalogProducts
        ];
      },
      error: () => {
        this.allProducts = [];
        this.catalogProducts = [];
        this.loopedProducts = [];
      }
    });
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      const track = this.carouselTrack?.nativeElement;
      if (!track) return;
      const card = track.querySelector('.product-card') as HTMLElement;
      const cardWidth = card?.offsetWidth ?? 300;
      // Start at middle copy
      track.scrollLeft = (cardWidth + this.GAP_PX) * this.catalogProducts.length;
    }, 50);
  }

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
        this.puntosActuales = cliente.puntos_acumulados;
        this.nombreCliente = `${cliente.nombres} ${cliente.apellidos}`;
        this.ultimoDniConsultado = this.dniConsulta;
        this.cargando = false;
        this.iniciarCooldown();
      },
      error: (err) => {
        if (err.status === 404) {
          this.mensajeError = 'Aún no te encuentras registrado.';
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

  puedeRedimir(product: CatalogProduct): boolean {
    return this.puntosActuales >= product.pointsRequired;
  }

  abrirDialogoRedencion(product: CatalogProduct): void {
    if (this.puntosActuales === 0) {
      alert('Por favor consulta tus puntos primero');
      return;
    }
    this.selectedProduct = product;
    this.mostrarDialogoRedencion = true;
  }

  confirmarRedencion(): void {
    if (this.selectedProduct && this.puedeRedimir(this.selectedProduct)) {
      // Perform redemption API call here
      this.puntosActuales -= this.selectedProduct.pointsRequired;
      this.mostrarDialogoRedencion = false;
      this.selectedProduct = null;
    }
  }

  cerrarDialogoRedencion(): void {
    this.mostrarDialogoRedencion = false;
    this.selectedProduct = null;
  }

  toggleVerTodos(): void {
    this.verTodos = !this.verTodos;

    if (this.verTodos) {
      setTimeout(() => {
        const COLS = 5;
        const cards = Array.from(
          document.querySelectorAll('.all-product-card')
        ) as HTMLElement[];

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                (entry.target as HTMLElement).classList.add('visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
        );

        cards.forEach((card, i) => {
          const col = i % COLS;
          card.style.transitionDelay = `${col * 80}ms`;
          observer.observe(card);
        });
      }, 60);
    }
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  // Carousel navigation
  scrollCarousel(direction: number): void {
    const track = this.carouselTrack.nativeElement;
    const card = track.querySelector('.product-card') as HTMLElement;
    const cardWidth = card?.offsetWidth ?? 300;
    track.scrollBy({ left: direction * (cardWidth + this.GAP_PX), behavior: 'smooth' });
  }

  onCarouselScroll(): void {
    const track = this.carouselTrack.nativeElement;
    const card = track.querySelector('.product-card') as HTMLElement;
    const cardWidth = card?.offsetWidth ?? 300;
    const sectionWidth = (cardWidth + this.GAP_PX) * this.catalogProducts.length;

    if (track.scrollLeft >= sectionWidth * 2 || track.scrollLeft <= 0) {
      // Instant jump: disable smooth temporarily
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = sectionWidth;
      // Re-enable smooth on next frame
      requestAnimationFrame(() => {
        track.style.scrollBehavior = '';
      });
    }
  }

  // Mouse drag
  onDragStart(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.pageX;
    this.scrollStartX = this.carouselTrack.nativeElement.scrollLeft;
    this.carouselTrack.nativeElement.style.cursor = 'grabbing';
    event.preventDefault();
  }

  onDragMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const delta = event.pageX - this.dragStartX;
    this.carouselTrack.nativeElement.scrollLeft = this.scrollStartX - delta;
  }

  onDragEnd(): void {
    this.isDragging = false;
    if (this.carouselTrack?.nativeElement) {
      this.carouselTrack.nativeElement.style.cursor = 'grab';
    }
  }

  // Touch drag
  onTouchStart(event: TouchEvent): void {
    this.dragStartX = event.touches[0].pageX;
    this.scrollStartX = this.carouselTrack.nativeElement.scrollLeft;
  }

  onTouchMove(event: TouchEvent): void {
    const delta = event.touches[0].pageX - this.dragStartX;
    this.carouselTrack.nativeElement.scrollLeft = this.scrollStartX - delta;
  }

  ngOnDestroy() {
    if (this.intervaloCooldown) {
      clearInterval(this.intervaloCooldown);
    }
  }
}

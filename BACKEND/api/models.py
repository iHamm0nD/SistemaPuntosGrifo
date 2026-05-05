from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UsuarioManager(BaseUserManager):
    # Gestor personalizado para el modelo Usuario
    def create_user(self, username, password=None, **extra_fields):
        # Crea y guarda un usuario con un nombre de usuario y contraseña
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        # Crea y guarda un superusuario con permisos totales
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El campo staff debe ser True')

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El campo superusuario debe ser True')

        return self.create_user(username, password, **extra_fields)


class Usuario(AbstractUser):
    # Modelo para dueños, empleados y desarrolladores
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=15, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    tipo_usuario = models.CharField(max_length=20, choices=[
        ('empleado', 'Empleado'),
        ('dueno', 'Dueño'),
        ('dev', 'Desarrollador')],
        default='empleado')

    objects = UsuarioManager()

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

    def actualizar_perfil(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.save()


class TipoCombustible(models.Model):
    nombre = models.CharField(max_length=50)
    precio_referencial = models.DecimalField(max_digits=6, decimal_places=2,
                                              help_text="Precio referencial por galón en S/.")
    puntos_por_galon = models.IntegerField(
        help_text="Puntos que otorga por cada galón consumido", default=0)
    puntos_por_diez_soles = models.DecimalField(
        max_digits=5, decimal_places=2, default=2.00,
        help_text="Puntos que otorga por cada 10 soles consumidos")

    def __str__(self):
        return f"{self.nombre} - {self.puntos_por_galon} pts/gal"

    class Meta:
        verbose_name = "Tipo de Combustible"
        verbose_name_plural = "Tipos de Combustible"


class Cliente(models.Model):
    # Modelo que almacena la información del cliente y sus puntos acumulados
    dni = models.CharField(max_length=15, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    puntos_acumulados = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fecha_registro = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.puntos_acumulados} pts"

    class Meta:
        ordering = ['-puntos_acumulados']


class RegistroConsumo(models.Model):
    nro_boleta = models.CharField(max_length=50, unique=True,
                                   help_text="Número de boleta o factura emitida (único por registro)")
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='consumos')
    empleado = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True,
                                  related_name='registros_realizados')
    tipo_combustible = models.ForeignKey(TipoCombustible, on_delete=models.CASCADE)
    galones = models.DecimalField(max_digits=8, decimal_places=2,
                                   help_text="Cantidad de galones consumidos")
    monto_total = models.DecimalField(max_digits=10, decimal_places=2,
                                       help_text="Monto total de la compra en S/.")
    puntos_otorgados = models.DecimalField(max_digits=10, decimal_places=2, help_text="Puntos otorgados por esta transacción")
    producto_canjeado = models.ForeignKey('ProductoCanjeable', on_delete=models.SET_NULL, null=True, blank=True, related_name='canjes_realizados')
    fecha = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # Calcular puntos y monto antes de guardar si no se proporcionaron
        if not self.monto_total:
            self.monto_total = self.galones * self.tipo_combustible.precio_referencial
            
        super().save(*args, **kwargs)
        
        # Una vez guardado el consumo, sumamos todos los consumos del cliente para actualizar sus puntos totales
        from django.db.models import Sum
        total_puntos = self.cliente.consumos.aggregate(
            total=Sum('puntos_otorgados')
        )['total'] or 0
        self.cliente.puntos_acumulados = total_puntos
        self.cliente.save()

    def __str__(self):
        return f"{self.cliente.nombres} - {self.tipo_combustible.nombre} - {self.puntos_otorgados} pts"

    def delete(self, *args, **kwargs):
        # Al eliminar un consumo, debemos restar los puntos que le otorgó al cliente
        cliente = self.cliente
        super().delete(*args, **kwargs)
        # Recalcular saldo de puntos mediante suma de registros restantes
        from django.db.models import Sum
        total_puntos = cliente.consumos.aggregate(
            total=Sum('puntos_otorgados')
        )['total'] or 0
        cliente.puntos_acumulados = total_puntos
        cliente.save()

    class Meta:
        ordering = ['-fecha']
        verbose_name = "Registro de Consumo"
        verbose_name_plural = "Registros de Consumo"


class ProductoCanjeable(models.Model):
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, default='')
    puntos_requeridos = models.IntegerField(help_text="Puntos necesarios para canjear este producto")
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    stock = models.IntegerField(default=0, help_text="Unidades disponibles en stock")
    activo = models.BooleanField(default=True)
    destacado = models.BooleanField(default=False, help_text="Aparece en productos destacados del inicio")
    fecha_creacion = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.nombre} - {self.puntos_requeridos} pts"

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = "Producto Canjeable"
        verbose_name_plural = "Productos Canjeables"
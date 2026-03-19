from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UsuarioManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Correo es obligatorio')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El campo staff debe ser True')

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El campo superusuario debe ser True')

        return self.create_user(username, email, password, **extra_fields)


class Usuario(AbstractUser):
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
        help_text="Puntos que otorga por cada galón consumido")

    def __str__(self):
        return f"{self.nombre} - {self.puntos_por_galon} pts/gal"

    class Meta:
        verbose_name = "Tipo de Combustible"
        verbose_name_plural = "Tipos de Combustible"


class Cliente(models.Model):
    dni = models.CharField(max_length=15, unique=True)
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    puntos_acumulados = models.IntegerField(default=0)
    fecha_registro = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.puntos_acumulados} pts"

    class Meta:
        ordering = ['-puntos_acumulados']


class RegistroConsumo(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='consumos')
    empleado = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True,
                                  related_name='registros_realizados')
    tipo_combustible = models.ForeignKey(TipoCombustible, on_delete=models.CASCADE)
    galones = models.DecimalField(max_digits=8, decimal_places=2,
                                   help_text="Cantidad de galones consumidos")
    monto_total = models.DecimalField(max_digits=10, decimal_places=2,
                                       help_text="Monto total de la compra en S/.")
    puntos_otorgados = models.IntegerField(help_text="Puntos otorgados por esta transacción")
    fecha = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # Calcular puntos automáticamente
        if not self.puntos_otorgados:
            self.puntos_otorgados = int(self.galones) * self.tipo_combustible.puntos_por_galon
        # Calcular monto total automáticamente
        if not self.monto_total:
            self.monto_total = self.galones * self.tipo_combustible.precio_referencial
        super().save(*args, **kwargs)
        # Actualizar los puntos acumulados del cliente
        self.cliente.puntos_acumulados = sum(
            c.puntos_otorgados for c in self.cliente.consumos.all()
        )
        self.cliente.save()

    def __str__(self):
        return f"{self.cliente.nombres} - {self.tipo_combustible.nombre} - {self.puntos_otorgados} pts"

    class Meta:
        ordering = ['-fecha']
        verbose_name = "Registro de Consumo"
        verbose_name_plural = "Registros de Consumo"
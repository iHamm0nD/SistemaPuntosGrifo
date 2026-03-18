from django.db import models
from django.utils import timezone  # para manejar fechas y horas
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UsuarioManager(BaseUserManager):
    def create_user(self,username,email,password=None,**extra_fields):
        #Creamos un usario en base a nombre de usuario, contraseña y correo
        if not email:
            raise ValueError('Correo es obligatorio')
        email = self.normalize_email(email)
        user = self.model(username=username,email=email,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
        
    
    def create_superuser(self,username,email,password=None,**extra_fields):
        #Creamos un superusario en base a nombre de usuario, contraseña y correo
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El campo staff debe ser True')
        
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El campo superusuario debe ser True')
        
        return self.create_user(username,email,password,**extra_fields)


# Representa a todos los usuarios del sistema: pacientes, médicos y administradores.
class Usuario(AbstractUser):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    dni = models.CharField(max_length=15, unique=True)
    #correo = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    tipo_usuario = models.CharField(max_length=20, choices=[
        ('paciente', 'Paciente'),
        ('medico', 'Médico'),
        ('admin', 'Administrador')],
        default='paciente') #CORREGIR ESTO PARA QUE DEFAULT SEA PACIENTE

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

    # Permite actualizar atributos del usuario con los datos proporcionados
    def actualizar_perfil(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.save()
    
    pass


# Representa a los pacientes del sistema, enlazado con un usuario.
class Paciente(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    fecha_nacimiento = models.DateField()
    direccion = models.TextField()
    
    # Permite al paciente solicitar una cita
    def solicitar_cita(self, especialidad, fecha, hora):
        return Cita.objects.create(
            fecha=fecha,
            hora=hora,
            especialidad=especialidad,
            paciente=self)

    # Devuelve el historial médico del paciente
    def consultar_historial(self):
        return self.historialmedico_set.all()
    
    def __str__(self):
        return self.usuario.nombre


# Representa una especialidad médica (ej. pediatría, cardiología).
class Especialidad(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()

    def __str__(self):
        return self.nombre


# Representa a los médicos del sistema, enlazado con un usuario.
class Medico(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    especialidad = models.ForeignKey(Especialidad, on_delete=models.CASCADE)
    
    # Ya no se necesita horario_libre: lo quitamos

    def ver_citas_asignadas(self):
        return self.cita_set.all()

    def registrar_atencion(self, cita, observaciones):
        HistorialMedico.objects.create(paciente=cita.paciente, observaciones=observaciones)
        cita.estado = 'atendida'
        cita.save()

    def __str__(self):
        return self.usuario.nombre
    
DIAS_SEMANA = [
    ('lunes', 'Lunes'),
    ('martes', 'Martes'),
    ('miércoles', 'Miércoles'),
    ('jueves', 'Jueves'),
    ('viernes', 'Viernes'),
    ('sábado', 'Sábado'),
    ('domingo', 'Domingo'),
]

class Horario(models.Model):
    medico = models.ForeignKey(Medico, on_delete=models.CASCADE)
    dia_semana = models.CharField(max_length=10, choices=DIAS_SEMANA)
    hora_inicio = models.TimeField() 
    hora_final = models.TimeField()

    def __str__(self):
        return f"{self.medico} - {self.dia_semana} ({self.hora_inicio} - {self.hora_final})"



# Representa una cita médica entre un paciente y un médico.
class Cita(models.Model):
    ESTADO_OPCIONES = [
        ('pendiente', 'Pendiente'),
        ('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),
        ('atendida', 'Atendida')]

    fecha = models.DateField()
    hora = models.TimeField()
    especialidad = models.ForeignKey(Especialidad, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_OPCIONES, default='pendiente')
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    medico = models.ForeignKey(Medico, on_delete=models.CASCADE)

    # Cambia el estado de la cita a cancelada
    def cancelar(self):
        self.estado = 'cancelada'
        self.save()

    # Cambia el estado de la cita a confirmada
    def confirmar(self):
        self.estado = 'confirmada'
        self.save()


# Registra las visitas al centro médico asociadas a una cita.
class RegistroVisitas(models.Model):
    nombre = models.CharField(max_length=100)
    documento = models.CharField(max_length=20)
    hora_ingreso = models.DateTimeField(default=timezone.now)
    motivo = models.TextField()
    cita = models.ForeignKey(Cita, on_delete=models.CASCADE, related_name='visitas')


# Representa a los administradores del sistema, enlazado con un usuario.
class Administrador(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)

    # Crea un nuevo usuario con los datos proporcionados
    def crear_usuario(self, **datos_usuario):
        return Usuario.objects.create(**datos_usuario)

    # Permite modificar los datos de una cita
    def modificar_cita(self, cita, **nuevos_datos):
        for key, value in nuevos_datos.items():
            setattr(cita, key, value)
        cita.save()

    # Elimina un usuario del sistema por su ID
    def eliminar_usuario(self, usuario_id):
        Usuario.objects.filter(id=usuario_id).delete()


# Registra observaciones médicas relacionadas a un paciente, formando su historial clínico.
class HistorialMedico(models.Model):
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    observaciones = models.TextField()
    fecha = models.DateTimeField(default=timezone.now)


# class UnidadMedida(models.Model):
#     unidad = models.CharField(max_length=20)
#     sigla = models.CharField(max_length=5)
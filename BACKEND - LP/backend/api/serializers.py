from rest_framework import serializers 
from . import models

# ========================== USUARIO ==========================

class UsuarioSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = models.Usuario
        fields = '__all__'

    def create(self, validated_data):
        # Esto asegura que se use create_user (que hashea la contraseña)
        return models.Usuario.objects.create_user(**validated_data)

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    direccion = serializers.CharField(source='paciente.direccion', allow_blank=True, required=False)

    class Meta:
        model = models.Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'dni', 'telefono', 'direccion']

    def update(self, instance, validated_data):
        paciente_data = validated_data.pop('paciente', {})
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.apellido = validated_data.get('apellido', instance.apellido)
        instance.email = validated_data.get('email', instance.email)
        instance.dni = validated_data.get('dni', instance.dni)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.save()

        if hasattr(instance, 'paciente') and paciente_data:
            instance.paciente.direccion = paciente_data.get('direccion', instance.paciente.direccion)
            instance.paciente.save()

        return instance

# ========================== PACIENTE ==========================

class PacienteSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Paciente
        fields = '__all__'

class PacienteRegistroSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializers()  

    class Meta:
        model = models.Paciente
        fields = ['usuario','fecha_nacimiento', 'direccion']  

    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario')
        password = usuario_data.pop('password')
        usuario_data['tipo_usuario'] = 'paciente'
        user = models.Usuario.objects.create_user(password=password, **usuario_data)
        paciente = models.Paciente.objects.create(usuario=user, **validated_data)
        return paciente

# ========================== ESPECIALIDAD ==========================

class EspecialidadSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Especialidad
        fields = '__all__'

# ========================== MÉDICO ==========================

class MedicoSerializers(serializers.ModelSerializer):
    usuario = UsuarioSerializers()
    especialidad = EspecialidadSerializers()

    class Meta:
        model = models.Medico
        fields = '__all__'

class MedicoRegistroSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializers()
    especialidad = serializers.PrimaryKeyRelatedField(queryset=models.Especialidad.objects.all())

    class Meta:
        model = models.Medico
        fields = ["id", "usuario", "especialidad"]

    def create(self, validated_data):
        usuario_data = validated_data.pop('usuario')
        password = usuario_data.pop('password')
        usuario_data['tipo_usuario'] = 'medico'
        user = models.Usuario.objects.create_user(password=password, **usuario_data)
        return models.Medico.objects.create(usuario=user, **validated_data)
    

class MedicoPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Medico
        fields = ['id', 'usuario', 'especialidad']



# ========================== HORARIO ==========================

class HorarioSerializers(serializers.ModelSerializer):
    medico_nombre = serializers.CharField(source='medico.usuario.nombre', read_only=True)

    class Meta:
        model = models.Horario
        fields = '__all__'

# ========================== CITA ==========================

class CitaReadSerializers(serializers.ModelSerializer):
    especialidad = EspecialidadSerializers()
    medico = MedicoSerializers()

    class Meta:
        model = models.Cita
        fields = '__all__'

class CitaSerializers(serializers.ModelSerializer):
    especialidad = serializers.PrimaryKeyRelatedField(queryset=models.Especialidad.objects.all())
    medico = serializers.PrimaryKeyRelatedField(queryset=models.Medico.objects.all())
    paciente = serializers.PrimaryKeyRelatedField(queryset=models.Paciente.objects.all())

    class Meta:
        model = models.Cita
        fields = '__all__'

# ========================== REGISTRO VISITAS ==========================

class RegistroVisitasSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.RegistroVisitas
        fields = '__all__'

# ========================== ADMINISTRADOR ==========================

class AdministradorSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.Administrador
        fields = '__all__'

# ========================== HISTORIAL MÉDICO ==========================

class HistorialMedicoSerializers(serializers.ModelSerializer):
    class Meta:
        model = models.HistorialMedico
        fields = '__all__'

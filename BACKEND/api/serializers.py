from rest_framework import serializers
from . import models


# ========================== USUARIO ==========================

class UsuarioSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = models.Usuario
        fields = '__all__'

    def create(self, validated_data):
        return models.Usuario.objects.create_user(**validated_data)


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Usuario
        fields = ['id', 'nombre', 'apellido', 'email', 'dni', 'telefono', 'tipo_usuario']

    def update(self, instance, validated_data):
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.apellido = validated_data.get('apellido', instance.apellido)
        instance.email = validated_data.get('email', instance.email)
        instance.dni = validated_data.get('dni', instance.dni)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.save()
        return instance


class EmpleadoRegistroSerializer(serializers.ModelSerializer):
    """Serializer para que un Dev o Dueño registre empleados"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = models.Usuario
        fields = ['id', 'username', 'password', 'nombre', 'apellido', 'dni',
                  'email', 'telefono', 'tipo_usuario']

    def create(self, validated_data):
        return models.Usuario.objects.create_user(**validated_data)


# ========================== TIPO COMBUSTIBLE ==========================

class TipoCombustibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TipoCombustible
        fields = '__all__'


# ========================== CLIENTE ==========================

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Cliente
        fields = '__all__'
        read_only_fields = ['puntos_acumulados']


class ClienteResumenSerializer(serializers.ModelSerializer):
    """Serializer ligero para ranking/dashboard"""
    total_consumos = serializers.SerializerMethodField()

    class Meta:
        model = models.Cliente
        fields = ['id', 'dni', 'nombres', 'apellidos', 'puntos_acumulados',
                  'fecha_registro', 'total_consumos']

    def get_total_consumos(self, obj):
        return obj.consumos.count()


# ========================== REGISTRO CONSUMO ==========================

class RegistroConsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RegistroConsumo
        fields = '__all__'
        read_only_fields = ['puntos_otorgados', 'monto_total', 'empleado']


class RegistroConsumoReadSerializer(serializers.ModelSerializer):
    """Serializer para lectura con datos expandidos"""
    cliente_dni = serializers.CharField(source='cliente.dni', read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    cliente_puntos = serializers.IntegerField(source='cliente.puntos_acumulados', read_only=True)
    tipo_combustible_nombre = serializers.CharField(source='tipo_combustible.nombre', read_only=True)
    empleado_nombre = serializers.SerializerMethodField()

    class Meta:
        model = models.RegistroConsumo
        fields = ['id', 'cliente', 'cliente_dni', 'cliente_nombre', 'cliente_puntos', 'empleado', 'empleado_nombre',
                  'tipo_combustible', 'tipo_combustible_nombre', 'galones',
                  'monto_total', 'puntos_otorgados', 'fecha']

    def get_cliente_nombre(self, obj):
        return f"{obj.cliente.nombres} {obj.cliente.apellidos}"

    def get_empleado_nombre(self, obj):
        if obj.empleado:
            primer_nombre = obj.empleado.nombre.split()[0] if obj.empleado.nombre else ""
            primer_apellido = obj.empleado.apellido.split()[0] if obj.empleado.apellido else ""
            return f"{primer_nombre} {primer_apellido}".strip()
        return "Empleado Eliminado"


class RegistrarConsumoSerializer(serializers.Serializer):
    """Serializer para el formulario de registro del empleado"""
    dni = serializers.CharField(max_length=15)
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    tipo_combustible = serializers.PrimaryKeyRelatedField(
        queryset=models.TipoCombustible.objects.all())
    monto_consumido = serializers.DecimalField(max_digits=10, decimal_places=2)

    def create(self, validated_data):
        # Buscar o crear el cliente
        cliente, created = models.Cliente.objects.get_or_create(
            dni=validated_data['dni'],
            defaults={
                'nombres': validated_data['nombres'],
                'apellidos': validated_data['apellidos'],
            }
        )

        # Si el cliente ya existe, actualizar nombres por si cambió
        if not created:
            cliente.nombres = validated_data['nombres']
            cliente.apellidos = validated_data['apellidos']
            cliente.save()

        # Crear el registro de consumo
        tipo_combustible = validated_data['tipo_combustible']
        monto = validated_data['monto_consumido']
        
        # Calcular galones según el monto y precios referenciales
        galones = monto / tipo_combustible.precio_referencial
        
        # Calcular puntos (usamos galones enteros como base, o puedes redondear el monto como prefieras, aquí mantengo logica por galon)
        puntos = int(galones) * tipo_combustible.puntos_por_galon

        registro = models.RegistroConsumo.objects.create(
            cliente=cliente,
            empleado=self.context.get('empleado'),
            tipo_combustible=tipo_combustible,
            galones=galones,
            puntos_otorgados=puntos,
            monto_total=monto
        )

        # Recalcular puntos del cliente
        cliente.puntos_acumulados = sum(
            c.puntos_otorgados for c in cliente.consumos.all()
        )
        cliente.save()

        return registro

from rest_framework import serializers
from . import models


# ========================== USUARIOS ==========================
# Serializadores encargados de convertir los objetos de Usuario a JSON y viceversa

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
        fields = ['id', 'nombre', 'apellido', 'dni', 'telefono', 'tipo_usuario']

    def update(self, instance, validated_data):
        # Sobrescribimos el método update para guardar cambios de perfil
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.apellido = validated_data.get('apellido', instance.apellido)
        instance.dni = validated_data.get('dni', instance.dni)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.save()
        return instance


class EmpleadoRegistroSerializer(serializers.ModelSerializer):
    """Serializer especial para que un Dev o Dueño registre y de alta a nuevos empleados"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = models.Usuario
        fields = ['id', 'username', 'password', 'nombre', 'apellido', 'dni', 'telefono', 'tipo_usuario']

    def create(self, validated_data):
        return models.Usuario.objects.create_user(**validated_data)


# ========================== COMBUSTIBLES ==========================

class TipoCombustibleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TipoCombustible
        fields = '__all__'


# ========================== CLIENTE ==========================
# Encargados de enviar y validar datos sobre los clientes (DNI y puntos).

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Cliente
        fields = '__all__'
        read_only_fields = ['puntos_acumulados']


class ClienteResumenSerializer(serializers.ModelSerializer):
    """Serializer ligero diseñado específicamente para el dashboard y los ránkings de clientes"""
    total_consumos = serializers.SerializerMethodField()

    class Meta:
        model = models.Cliente
        fields = ['id', 'dni', 'nombres', 'apellidos', 'puntos_acumulados',
                  'fecha_registro', 'total_consumos']

    def get_total_consumos(self, obj):
        if hasattr(obj, 'total_consumos_annotated'):
            return obj.total_consumos_annotated
        return obj.consumos.count()


# ========================== CONSUMOS ==========================
# Administra la carga e interfaz de cada compra y cuántos puntos recibe

class RegistroConsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RegistroConsumo
        fields = '__all__'
        read_only_fields = ['puntos_otorgados', 'monto_total', 'empleado']


class RegistroConsumoReadSerializer(serializers.ModelSerializer):
    """Versión expandida del serializador de lectura. Incluye nombres anidados en lugar de simples IDs"""
    cliente_dni = serializers.CharField(source='cliente.dni', read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    cliente_puntos = serializers.DecimalField(source='cliente.puntos_acumulados', max_digits=10, decimal_places=2, read_only=True)
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
    """Serializer principal usado por la interfaz de Empleado (Front) al registrar un tanqueo."""
    dni = serializers.CharField(max_length=15)
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    tipo_combustible = serializers.PrimaryKeyRelatedField(
        queryset=models.TipoCombustible.objects.all())
    monto_consumido = serializers.DecimalField(max_digits=10, decimal_places=2)
    tanque_lleno = serializers.BooleanField(default=False)

    def create(self, validated_data):
        # Busca en la BD el cliente con ese DNI; si no lo encuentra, lo crea automáticamente
        cliente, created = models.Cliente.objects.get_or_create(
            dni=validated_data['dni'],
            defaults={
                'nombres': validated_data['nombres'],
                'apellidos': validated_data['apellidos'],
            }
        )

        # En caso el cliente ya existiese pero tenga diferentes nombres en RENIEC se corrigen u actualizan
        if not created:
            cliente.nombres = validated_data['nombres']
            cliente.apellidos = validated_data['apellidos']
            cliente.save()

        # Asigna la relación de combustible y dinero abonado
        tipo_combustible = validated_data['tipo_combustible']
        monto = validated_data['monto_consumido']
        tanque_lleno = validated_data.get('tanque_lleno', False)
        
        # Calcula indirectamente la cantidad de galones según el precio tarifario
        galones = monto / tipo_combustible.precio_referencial
        
        from decimal import Decimal
        is_premium = 'premium' in tipo_combustible.nombre.lower()
        
        # Calcular los bloques de 10 soles completados (ej: 18 soles = 1 bloque, 20 soles = 2 bloques)
        tramos_de_10 = int(monto // Decimal('10.0'))
        
        base_points = Decimal(str(tramos_de_10)) * (Decimal('2.5') if is_premium else Decimal('2.0'))
        puntos = base_points + (Decimal('2.0') if tanque_lleno else Decimal('0.0'))
        puntos = round(puntos, 2)

        registro = models.RegistroConsumo.objects.create(
            cliente=cliente,
            empleado=self.context.get('empleado'),
            tipo_combustible=tipo_combustible,
            galones=galones,
            puntos_otorgados=puntos,
            monto_total=monto
        )

        # Usamos anotaciones nativas de la DB para recalcular el puntaje de todo el expediente del cliente
        from django.db.models import Sum
        total_puntos = cliente.consumos.aggregate(
            total=Sum('puntos_otorgados')
        )['total'] or 0
        cliente.puntos_acumulados = total_puntos
        cliente.save()

        return registro

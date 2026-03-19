from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from django.db.models import Sum, Count

from . import models, serializers


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)

            return Response({
                "token": token.key,
                'usuario': {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.nombre,
                    'last_name': user.apellido,
                    'email': user.email,
                    'dni': user.dni,
                    'telefono': user.telefono,
                    'tipo_usuario': user.tipo_usuario
                }
            })
        else:
            return Response({"error": "Credenciales Invalidas"}, status=400)


class UsuarioViewsets(viewsets.ModelViewSet):
    queryset = models.Usuario.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return serializers.PerfilUsuarioSerializer
        if self.action == 'create':
            return serializers.EmpleadoRegistroSerializer
        return serializers.UsuarioSerializers


class TipoCombustibleViewSet(viewsets.ModelViewSet):
    queryset = models.TipoCombustible.objects.all()
    serializer_class = serializers.TipoCombustibleSerializer
    permission_classes = [IsAuthenticated]


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = models.Cliente.objects.all()
    serializer_class = serializers.ClienteSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='ranking')
    def ranking(self, request):
        """Top clientes por puntos acumulados"""
        top = request.query_params.get('top', 20)
        clientes = models.Cliente.objects.order_by('-puntos_acumulados')[:int(top)]
        serializer = serializers.ClienteResumenSerializer(clientes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='buscar-dni')
    def buscar_por_dni(self, request):
        """Buscar un cliente por DNI"""
        dni = request.query_params.get('dni', '')
        if not dni:
            return Response({'error': 'Falta el parametro dni'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cliente = models.Cliente.objects.get(dni=dni)
            serializer = serializers.ClienteResumenSerializer(cliente)
            return Response(serializer.data)
        except models.Cliente.DoesNotExist:
            return Response({'error': 'Cliente no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class RegistroConsumoViewSet(viewsets.ModelViewSet):
    queryset = models.RegistroConsumo.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return serializers.RegistroConsumoReadSerializer
        return serializers.RegistroConsumoSerializer


@method_decorator(csrf_exempt, name='dispatch')
class RegistrarConsumoView(APIView):
    """
    Endpoint principal para que un empleado registre un consumo.
    Recibe: dni, nombres, apellidos, tipo_combustible, galones
    Busca o crea el cliente, registra el consumo y calcula puntos.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = serializers.RegistrarConsumoSerializer(
            data=request.data,
            context={'empleado': request.user}
        )
        if serializer.is_valid():
            registro = serializer.save()
            return Response({
                'mensaje': 'Consumo registrado correctamente',
                'detalle': {
                    'cliente': f"{registro.cliente.nombres} {registro.cliente.apellidos}",
                    'dni': registro.cliente.dni,
                    'combustible': registro.tipo_combustible.nombre,
                    'galones': str(registro.galones),
                    'monto_total': str(registro.monto_total),
                    'puntos_otorgados': registro.puntos_otorgados,
                    'puntos_acumulados': registro.cliente.puntos_acumulados,
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardView(APIView):
    """Dashboard con estadísticas para el dueño"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_clientes = models.Cliente.objects.count()
        total_puntos = models.Cliente.objects.aggregate(
            total=Sum('puntos_acumulados'))['total'] or 0
        total_consumos = models.RegistroConsumo.objects.count()

        # Top 10 clientes
        top_clientes = models.Cliente.objects.order_by('-puntos_acumulados')[:10]
        top_serializer = serializers.ClienteResumenSerializer(top_clientes, many=True)

        # Consumo por tipo de combustible
        consumo_por_tipo = models.RegistroConsumo.objects.values(
            'tipo_combustible__nombre'
        ).annotate(
            total_galones=Sum('galones'),
            total_registros=Count('id'),
            total_puntos=Sum('puntos_otorgados')
        ).order_by('-total_galones')

        # Últimos 10 registros
        ultimos = models.RegistroConsumo.objects.order_by('-fecha')[:10]
        ultimos_serializer = serializers.RegistroConsumoReadSerializer(ultimos, many=True)

        return Response({
            'total_clientes': total_clientes,
            'total_puntos_otorgados': total_puntos,
            'total_consumos': total_consumos,
            'top_clientes': top_serializer.data,
            'consumo_por_tipo': list(consumo_por_tipo),
            'ultimos_registros': ultimos_serializer.data,
        })

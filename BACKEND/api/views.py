from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from django.db.models import Sum, Count, Q
from rest_framework.pagination import PageNumberPagination
from . import models, serializers, permissions


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
    # Solo Dueños/Devs pueden gestionar usuarios en general
    permission_classes = [permissions.IsDueno]

    def get_queryset(self):
        # Si por alguna razón un empleado llega aquí, solo vería su propio usuario
        if self.request.user.tipo_usuario == 'empleado':
            return self.queryset.filter(id=self.request.user.id)
        
        queryset = super().get_queryset()
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo_usuario=tipo)
        return queryset

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return serializers.PerfilUsuarioSerializer
        if self.action == 'create':
            return serializers.EmpleadoRegistroSerializer
        return serializers.UsuarioSerializers


class TipoCombustibleViewSet(viewsets.ModelViewSet):
    queryset = models.TipoCombustible.objects.all()
    serializer_class = serializers.TipoCombustibleSerializer
    
    def get_permissions(self):
        # Todos pueden ver, pero solo Dueños pueden modificar
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [permissions.IsDueno()]


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = models.Cliente.objects.all()
    serializer_class = serializers.ClienteSerializer
    
    def get_permissions(self):
        # Solo Dueños pueden eliminar clientes
        if self.action == 'destroy':
            return [permissions.IsDueno()]
        return [IsAuthenticated()]

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


class ConsumoPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class RegistroConsumoViewSet(viewsets.ModelViewSet):
    queryset = models.RegistroConsumo.objects.all().order_by('-fecha')
    permission_classes = [IsAuthenticated]
    pagination_class = ConsumoPagination

    def get_permissions(self):
        # Solo Dueños pueden eliminar consumos
        if self.action == 'destroy':
            return [permissions.IsDueno()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(cliente__dni__icontains=search) | 
                Q(cliente__nombres__icontains=search) | 
                Q(cliente__apellidos__icontains=search)
            )
        return queryset

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


class CambiarPasswordView(APIView):
    """Permite al dueño cambiar la contraseña de un empleado"""
    permission_classes = [permissions.IsDueno]

    def post(self, request):
        usuario_id = request.data.get('usuario_id')
        nueva_password = request.data.get('nueva_password')

        if not usuario_id or not nueva_password:
            return Response({'error': 'Faltan datos requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = models.Usuario.objects.get(id=usuario_id)
            
            # Seguridad extra: Un Dueño no puede cambiar la clave de un Dev 
            # (opcional, pero recomendado)
            if usuario.tipo_usuario == 'dev' and request.user.tipo_usuario != 'dev':
                return Response({'error': 'No tienes permiso para cambiar la clave de un Desarrollador.'}, 
                                status=status.HTTP_403_FORBIDDEN)
                                
        except models.Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        usuario.set_password(nueva_password)
        usuario.save()
        return Response({'mensaje': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)


class DashboardView(APIView):
    """Dashboard con estadísticas para el dueño"""
    permission_classes = [permissions.IsDueno]

    def get(self, request):
        total_clientes = models.Cliente.objects.count()
        total_puntos = models.Cliente.objects.aggregate(
            total=Sum('puntos_acumulados'))['total'] or 0
        total_consumos = models.RegistroConsumo.objects.count()

        # Top 5 clientes
        top_clientes = models.Cliente.objects.order_by('-puntos_acumulados')[:5]
        top_serializer = serializers.ClienteResumenSerializer(top_clientes, many=True)

        # Consumo por tipo de combustible
        consumo_por_tipo = models.RegistroConsumo.objects.values(
            'tipo_combustible__nombre'
        ).annotate(
            total_galones=Sum('galones'),
            total_registros=Count('id'),
            total_puntos=Sum('puntos_otorgados')
        ).order_by('-total_galones')

        return Response({
            'total_clientes': total_clientes,
            'total_puntos_otorgados': total_puntos,
            'total_consumos': total_consumos,
            'top_clientes': top_serializer.data,
            'consumo_por_tipo': list(consumo_por_tipo),
        })

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from django.db.models import Sum, Count, Q
from rest_framework.pagination import PageNumberPagination
from . import models, serializers, permissions


class ProductoCanjeableViewSet(viewsets.ModelViewSet):
    queryset = models.ProductoCanjeable.objects.filter(activo=True)
    serializer_class = serializers.ProductoCanjeableSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [permissions.IsDueno()]

    def get_queryset(self):
        qs = models.ProductoCanjeable.objects.all()
        if self.action in ['list', 'retrieve']:
            if not self.request.user.is_authenticated or getattr(self.request.user, 'tipo_usuario', '') not in ['dueno', 'dev']:
                qs = qs.filter(activo=True)
        return qs

    @action(detail=False, methods=['post'], url_path='set-destacados',
            permission_classes=[permissions.IsDueno],
            parser_classes=[JSONParser])
    def set_destacados(self, request):
        """Configura qué productos aparecen como destacados en la página principal (4-6 productos)."""
        ids = request.data.get('ids', [])
        if not isinstance(ids, list):
            return Response({'error': 'Se esperaba una lista de IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(ids) < 4 or len(ids) > 6:
            return Response({'error': 'Debes seleccionar entre 4 y 6 productos destacados.'}, status=status.HTTP_400_BAD_REQUEST)
        # Verificar que todos los IDs existen
        encontrados = models.ProductoCanjeable.objects.filter(id__in=ids, activo=True).count()
        if encontrados != len(ids):
            return Response({'error': 'Uno o más productos no fueron encontrados.'}, status=status.HTTP_400_BAD_REQUEST)
        # Limpiar y reasignar
        models.ProductoCanjeable.objects.all().update(destacado=False)
        models.ProductoCanjeable.objects.filter(id__in=ids).update(destacado=True)
        return Response({'mensaje': f'{len(ids)} productos marcados como destacados.'}, status=status.HTTP_200_OK)



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
        # Filtrado de seguridad: si un empleado logra consultar este endpoint, solo vera su info
        if self.request.user.tipo_usuario == 'empleado':
            return self.queryset.filter(id=self.request.user.id)
        
        queryset = super().get_queryset()
        tipo = self.request.query_params.get('tipo', None)
        
        # Filtra si la lista es de empleados o de dueños
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
        # Solo Dueños pueden modificar o eliminar clientes directamente desde la API
        if self.action in ['destroy', 'update', 'partial_update', 'create']:
            return [permissions.IsDueno()]
        # Permitir que la acción 'buscar_por_dni' sea pública
        if self.action == 'buscar_por_dni':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='ranking')
    def ranking(self, request):
        """Top clientes por puntos acumulados"""
        top = request.query_params.get('top', 20)
        clientes = models.Cliente.objects.annotate(
            total_consumos_annotated=Count('consumos')
        ).order_by('-puntos_acumulados')[:int(top)]
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
    queryset = models.RegistroConsumo.objects.select_related('cliente', 'empleado', 'tipo_combustible').order_by('-fecha')
    permission_classes = [IsAuthenticated]
    pagination_class = ConsumoPagination

    def get_permissions(self):
        # Solo Dueños pueden eliminar o modificar consumos directamente
        if self.action in ['destroy', 'update', 'partial_update']:
            return [permissions.IsDueno()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        tipo = self.request.query_params.get('tipo', None)
        
        if search:
            queryset = queryset.filter(cliente__dni__icontains=search)
            
        if tipo == 'consumo':
            queryset = queryset.exclude(tipo_combustible__nombre='CANJE DE PUNTOS')
        elif tipo == 'canje':
            queryset = queryset.filter(tipo_combustible__nombre='CANJE DE PUNTOS')
            
        return queryset

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return serializers.RegistroConsumoReadSerializer
        return serializers.RegistroConsumoSerializer


@method_decorator(csrf_exempt, name='dispatch')
class RegistrarConsumoView(APIView):
    """
    Endpoint principal para que un empleado registre una nueva compra.
    Recibe: dni, nombres, apellidos, tipo_combustible, monto.
    Automáticamente vincula al cliente (o lo crea) y determina galones y puntaje a sumar.
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
                    'nro_boleta': registro.nro_boleta,
                    'fecha': registro.fecha,
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


class ValidarPasswordView(APIView):
    """Verifica si la contraseña dada coincide con la del usuario logueado. Útil para permisos críticos."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'error': 'La contraseña es requerida.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = authenticate(username=request.user.username, password=password)
        if user is not None:
            return Response({'mensaje': 'Contraseña válida.'}, status=status.HTTP_200_OK)
            
        return Response({'error': 'Contraseña incorrecta.'}, status=status.HTTP_401_UNAUTHORIZED)

class DashboardView(APIView):
    """Dashboard con estadísticas para el dueño"""
    permission_classes = [permissions.IsDueno]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        total_clientes = models.Cliente.objects.count()
        total_puntos = models.Cliente.objects.aggregate(
            total=Sum('puntos_acumulados'))['total'] or 0
        total_consumos = models.RegistroConsumo.objects.count()

        # Top 5 clientes
        top_clientes = models.Cliente.objects.annotate(
            total_consumos_annotated=Count('consumos')
        ).order_by('-puntos_acumulados')[:5]
        top_serializer = serializers.ClienteResumenSerializer(top_clientes, many=True)

        # Filtro de período para consumo por combustible
        periodo = request.query_params.get('periodo', 'total')  # dia, semana, mes, total
        consumo_qs = models.RegistroConsumo.objects.all()
        ahora = timezone.localtime(timezone.now())  # Hora local de Lima, no UTC

        if periodo == 'dia':
            consumo_qs = consumo_qs.filter(fecha__date=ahora.date())
        elif periodo == 'semana':
            inicio_semana = ahora - timedelta(days=7)
            consumo_qs = consumo_qs.filter(fecha__gte=inicio_semana)
        elif periodo == 'mes':
            inicio_mes = ahora - timedelta(days=30)
            consumo_qs = consumo_qs.filter(fecha__gte=inicio_mes)

        # Consumo por tipo de combustible (excluir canjes)
        consumo_por_tipo = consumo_qs.exclude(
            tipo_combustible__nombre='CANJE DE PUNTOS'
        ).values(
            'tipo_combustible__nombre'
        ).annotate(
            total_monto=Sum('monto_total'),
            total_registros=Count('id'),
            total_puntos=Sum('puntos_otorgados')
        ).order_by('-total_monto')

        return Response({
            'total_clientes': total_clientes,
            'total_puntos_otorgados': total_puntos,
            'total_consumos': total_consumos,
            'top_clientes': top_serializer.data,
            'consumo_por_tipo': list(consumo_por_tipo),
        })

class ConsultarDNIApiView(APIView):
    """
    Proxy y puente para consumir ApisPeru (dniruc) evadiendo bloqueos de CORS o límites.
    Busca por DNI en la RENIEC pùblica.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, dni):
        import urllib.request
        import urllib.error
        import json
        from rest_framework import status
        from django.conf import settings
        
        token = settings.DNI_API_TOKEN
        
        url_1 = f"https://dniruc.apisperu.com/api/v1/dni/{dni}?token={token}"
        url_2 = f"https://api.apis.net.pe/v2/reniec/dni?numero={dni}"
        
        def fetch_api(url, use_bearer):
            headers = {'User-Agent': 'Mozilla/5.0'}
            if use_bearer:
                headers['Authorization'] = f"Bearer {token}"
            try:
                req = urllib.request.Request(url, headers=headers)
                response = urllib.request.urlopen(req, timeout=10)
                return json.loads(response.read().decode('utf-8'))
            except Exception:
                # Si una de las URLs proxy falla, retonar nulo para permitir fallo silencioso a la otra URL
                return None

        data = fetch_api(url_1, use_bearer=False)
        if data and (data.get('success') or data.get('nombres')):
            return Response(data, status=status.HTTP_200_OK)

        data = fetch_api(url_2, use_bearer=True)
        if data and data.get('nombres'):
            return Response(data, status=status.HTTP_200_OK)

        return Response({'error': 'No se pudo consultar el DNI o el token es inválido', 'message': 'DNI no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class CanjearPuntosView(APIView):
    """Permite al dueño canjear (reducir) puntos de un cliente por DNI."""
    permission_classes = [permissions.IsDueno]

    def post(self, request):
        dni = request.data.get('dni')
        puntos_a_canjear = request.data.get('puntos')
        producto_id = request.data.get('producto_id')

        if not dni:
            return Response({'error': 'El DNI es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Si se envía producto_id, los puntos se toman del producto
        producto = None
        if producto_id:
            try:
                producto = models.ProductoCanjeable.objects.get(id=producto_id, activo=True)
                puntos_a_canjear = producto.puntos_requeridos
            except models.ProductoCanjeable.DoesNotExist:
                return Response({'error': 'Producto no encontrado o inactivo.'}, status=status.HTTP_404_NOT_FOUND)

        if not puntos_a_canjear:
            return Response({'error': 'Los puntos a canjear son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            puntos_a_canjear = float(puntos_a_canjear)
        except (ValueError, TypeError):
            return Response({'error': 'El valor de puntos no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        if puntos_a_canjear <= 0:
            return Response({'error': 'Los puntos a canjear deben ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cliente = models.Cliente.objects.get(dni=dni)
        except models.Cliente.DoesNotExist:
            return Response({'error': 'Este cliente no tiene consumos registrados en el sistema.'}, status=status.HTTP_404_NOT_FOUND)

        puntos_actuales = float(cliente.puntos_acumulados)
        if puntos_a_canjear > puntos_actuales:
            return Response({'error': f'El cliente solo tiene {puntos_actuales} puntos disponibles.'}, status=status.HTTP_400_BAD_REQUEST)

        # Si se seleccionó un producto, verificar y reducir su stock
        if producto:
            if producto.stock <= 0:
                return Response({'error': f'El producto "{producto.nombre}" está agotado.'}, status=status.HTTP_400_BAD_REQUEST)
            producto.stock -= 1
            producto.save()

        from decimal import Decimal
        puntos_a_canjear_decimal = Decimal(str(puntos_a_canjear))

        tipo_canje, _ = models.TipoCombustible.objects.get_or_create(
            nombre='CANJE DE PUNTOS',
            defaults={'precio_referencial': 0, 'puntos_por_galon': 0}
        )

        import uuid
        nro = f"CANJE-{uuid.uuid4().hex[:8].upper()}"
        if producto:
            nro = f"CANJE-{producto.nombre[:8].upper()}-{uuid.uuid4().hex[:6].upper()}"

        models.RegistroConsumo.objects.create(
            nro_boleta=nro,
            cliente=cliente,
            empleado=request.user,
            tipo_combustible=tipo_canje,
            producto_canjeado=producto,
            galones=0,
            monto_total=0,
            puntos_otorgados=-puntos_a_canjear_decimal
        )

        cliente.refresh_from_db()

        msg_producto = f' por "{producto.nombre}"' if producto else ''
        return Response({
            'mensaje': f'Se canjearon {puntos_a_canjear} puntos{msg_producto} correctamente.',
            'cliente': f'{cliente.nombres} {cliente.apellidos}',
            'puntos_restantes': float(cliente.puntos_acumulados),
            'producto': producto.nombre if producto else None,
            'stock_restante': producto.stock if producto else None,
        }, status=status.HTTP_200_OK)

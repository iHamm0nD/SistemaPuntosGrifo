from django.shortcuts import render
from . import models, serializers
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import CitaSerializers, PacienteRegistroSerializer, MedicoRegistroSerializer
from datetime import datetime, timedelta, date
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework import status, viewsets
import requests
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils.dateparse import parse_date
from datetime import datetime, time, timedelta
from . import models, serializers

class ReservarCitaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CitaSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"mensaje": "Cita reservada correctamente"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)

            # Obtener la direccion solo si es paciente
            direccion = None
            if hasattr(user, 'paciente'):
                direccion = user.paciente.direccion

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
                    'direccion': direccion,
                    'tipo_usuario': user.tipo_usuario
                }
            })
        else:
            return Response({"error": "Credenciales Invalidas"}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class RegistroPacienteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PacienteRegistroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'mensaje': 'Paciente registrado correctamente'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewsets(viewsets.ModelViewSet):
    queryset = models.Usuario.objects.all()

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return serializers.PerfilUsuarioSerializer
        return serializers.UsuarioSerializers


class PacienteViewsets(viewsets.ModelViewSet):
    queryset = models.Paciente.objects.all()
    serializer_class = serializers.PacienteSerializers


class PacienteIdView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            paciente = models.Paciente.objects.get(usuario=request.user)
            return Response({'paciente_id': paciente.id}, status=status.HTTP_200_OK)
        except models.Paciente.DoesNotExist:
            return Response({'error': 'No es un paciente'}, status=status.HTTP_404_NOT_FOUND)


class EspecialidadViewsets(viewsets.ModelViewSet):
    queryset = models.Especialidad.objects.all()
    serializer_class = serializers.EspecialidadSerializers


class MedicoViewsets(viewsets.ModelViewSet):
    queryset = models.Medico.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['especialidad']

    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.MedicoPostSerializer
        return serializers.MedicoSerializers


class HorarioViewSets(viewsets.ModelViewSet):
    queryset = models.Horario.objects.all()
    serializer_class = serializers.HorarioSerializers
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['medico', 'dia_semana']


class CitaViewsets(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        hoy = date.today()  # ← Esto es necesario

        if user.tipo_usuario == 'admin':
            return models.Cita.objects.all()

        try:
            paciente = models.Paciente.objects.get(usuario=user)
            return models.Cita.objects.filter(paciente=paciente, fecha__gte=hoy)
        except models.Paciente.DoesNotExist:
            return models.Cita.objects.none()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return serializers.CitaReadSerializers
        return serializers.CitaSerializers

    def create(self, request, *args, **kwargs):
        fecha = request.data.get('fecha')
        hora = request.data.get('hora')
        medico_id = request.data.get('medico')

        if not fecha or not hora or not medico_id:
            return Response({'error': 'Faltan datos obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si ya existe una cita para ese médico en esa fecha y hora
        cita_existente = models.Cita.objects.filter(
            fecha=fecha,
            hora=hora,
            medico_id=medico_id
        ).exists()

        if cita_existente:
            return Response(
                {'error': 'Ya existe una cita con este médico en esa fecha y hora.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='horas-disponibles')
    def horas_disponibles(self, request):
        fecha_str = request.query_params.get('fecha')
        medico_id = request.query_params.get('medico_id')

        if not fecha_str or not medico_id:
            return Response({'error': 'Faltan parámetros.'}, status=status.HTTP_400_BAD_REQUEST)

        # Convertir fecha y obtener día en español
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d")
        except ValueError:
            return Response({'error': 'Formato de fecha inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        DIA_TRADUCCION = {
            "monday": "lunes",
            "tuesday": "martes",
            "wednesday": "miércoles",
            "thursday": "jueves",
            "friday": "viernes",
            "saturday": "sábado",
            "sunday": "domingo"
        }

        dia_semana_ingles = fecha.strftime("%A").lower()
        dia_semana = DIA_TRADUCCION.get(dia_semana_ingles)

        if not dia_semana:
            return Response({'error': 'Día de la semana no válido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar horarios
        try:
            medico = models.Medico.objects.get(id=medico_id)
        except models.Medico.DoesNotExist:
            return Response({'error': 'Médico no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        horarios = models.Horario.objects.filter(medico=medico, dia_semana=dia_semana)

        if not horarios.exists():
            return Response({'horas': []})  # No hay horarios ese día

        # Filtrar las horas ya reservadas
        horas_ocupadas = models.Cita.objects.filter(
            medico=medico, fecha=fecha
        ).values_list('hora', flat=True)

        horas_disponibles = []
        for horario in horarios:
            hora_actual = horario.hora_inicio
            while hora_actual < horario.hora_final:
                if hora_actual not in horas_ocupadas:
                    horas_disponibles.append(hora_actual.strftime("%H:%M"))
                hora_actual = (datetime.combine(fecha, hora_actual) + timedelta(minutes=30)).time()

        return Response({'horas': horas_disponibles})

class RegistroVisitasViewsets(viewsets.ModelViewSet):
    queryset = models.RegistroVisitas.objects.all()
    serializer_class = serializers.RegistroVisitasSerializers


class AdministradorViewsets(viewsets.ModelViewSet):
    queryset = models.Administrador.objects.all()
    serializer_class = serializers.AdministradorSerializers


class HistorialMedicoViewsets(viewsets.ModelViewSet):
    queryset = models.HistorialMedico.objects.all()
    serializer_class = serializers.HistorialMedicoSerializers

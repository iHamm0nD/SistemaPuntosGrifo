from rest_framework import routers
from . import views
from django.urls import path, include

router = routers.DefaultRouter()

router.register('usuario', views.UsuarioViewsets)
router.register('paciente', views.PacienteViewsets)
router.register('especialidad', views.EspecialidadViewsets)     
router.register('medico', views.MedicoViewsets)
router.register('cita', views.CitaViewsets, basename='cita')
router.register('registrovisitas', views.RegistroVisitasViewsets)
router.register('administrador', views.AdministradorViewsets)
router.register('historialmedico', views.HistorialMedicoViewsets)
router.register('horario', views.HorarioViewSets)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.LoginView.as_view(), name='login/'),
    path('registro/', views.RegistroPacienteView.as_view(), name='registro/'),
    path('paciente-id/', views.PacienteIdView.as_view(), name='paciente-id/')
    #path('reservarcita/', views.ReservarCitaView.as_view(), name='reservarcita/'),
]
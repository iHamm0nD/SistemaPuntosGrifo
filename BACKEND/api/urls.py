from rest_framework import routers
from . import views
from django.urls import path, include

router = routers.DefaultRouter()

router.register('usuario', views.UsuarioViewsets)
router.register('tipo-combustible', views.TipoCombustibleViewSet)
router.register('cliente', views.ClienteViewSet)
router.register('registro-consumo', views.RegistroConsumoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.LoginView.as_view(), name='login'),
    path('registrar-consumo/', views.RegistrarConsumoView.as_view(), name='registrar-consumo'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('cambiar-password/', views.CambiarPasswordView.as_view(), name='cambiar-password'),
]
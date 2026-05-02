from rest_framework import routers
from . import views
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

router = routers.DefaultRouter()

router.register('usuario', views.UsuarioViewsets)
router.register('tipo-combustible', views.TipoCombustibleViewSet)
router.register('cliente', views.ClienteViewSet)
router.register('registro-consumo', views.RegistroConsumoViewSet)
router.register('producto', views.ProductoCanjeableViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.LoginView.as_view(), name='login'),
    path('registrar-consumo/', views.RegistrarConsumoView.as_view(), name='registrar-consumo'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('cambiar-password/', views.CambiarPasswordView.as_view(), name='cambiar-password'),
    path('validar-password/', views.ValidarPasswordView.as_view(), name='validar-password'),
    path('consultar-dni/<str:dni>/', views.ConsultarDNIApiView.as_view(), name='consultar-dni'),
    path('canjear-puntos/', views.CanjearPuntosView.as_view(), name='canjear-puntos'),
]
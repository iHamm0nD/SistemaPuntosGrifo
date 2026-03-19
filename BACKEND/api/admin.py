from django.contrib import admin
from .models import Usuario, TipoCombustible, Cliente, RegistroConsumo

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['username', 'nombre', 'apellido', 'dni', 'tipo_usuario']
    list_filter = ['tipo_usuario']
    search_fields = ['nombre', 'apellido', 'dni', 'username']

@admin.register(TipoCombustible)
class TipoCombustibleAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'precio_referencial', 'puntos_por_galon']

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['dni', 'nombres', 'apellidos', 'puntos_acumulados', 'fecha_registro']
    search_fields = ['dni', 'nombres', 'apellidos']
    ordering = ['-puntos_acumulados']

@admin.register(RegistroConsumo)
class RegistroConsumoAdmin(admin.ModelAdmin):
    list_display = ['cliente', 'tipo_combustible', 'galones', 'puntos_otorgados', 'fecha']
    list_filter = ['tipo_combustible', 'fecha']
    search_fields = ['cliente__dni', 'cliente__nombres']

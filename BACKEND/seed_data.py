"""
Script para crear datos iniciales del Sistema de Puntos.
Ejecutar con: py manage.py shell < seed_data.py
"""
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import TipoCombustible, Usuario

# Crear tipos de combustible con precios referenciales de Perú
combustibles = [
    {'nombre': 'GLP (Gas)', 'precio_referencial': 7.50, 'puntos_por_galon': 1},
    {'nombre': 'Gasohol 90', 'precio_referencial': 15.00, 'puntos_por_galon': 2},
    {'nombre': 'Diésel B5', 'precio_referencial': 14.50, 'puntos_por_galon': 2},
    {'nombre': 'Gasohol 95', 'precio_referencial': 17.50, 'puntos_por_galon': 3},
    {'nombre': 'Gasohol 97', 'precio_referencial': 19.50, 'puntos_por_galon': 4},
]

for c in combustibles:
    obj, created = TipoCombustible.objects.get_or_create(
        nombre=c['nombre'],
        defaults=c
    )
    estado = "CREADO" if created else "YA EXISTE"
    print(f"  {estado}: {obj}")

# Crear superusuario dev si no existe
if not Usuario.objects.filter(username='dev').exists():
    user = Usuario.objects.create_superuser(
        username='dev',
        email='dev@grifo.com',
        password='dev123',
        nombre='Desarrollador',
        apellido='Sistema',
        dni='00000000',
        tipo_usuario='dev'
    )
    print(f"  CREADO: Superusuario dev (password: dev123)")
else:
    print(f"  YA EXISTE: Superusuario dev")

# Crear un empleado de ejemplo
if not Usuario.objects.filter(username='empleado1').exists():
    emp = Usuario.objects.create_user(
        username='empleado1',
        email='empleado1@grifo.com',
        password='emp123',
        nombre='Carlos',
        apellido='Quispe',
        dni='12345678',
        tipo_usuario='empleado'
    )
    print(f"  CREADO: Empleado empleado1 (password: emp123)")
else:
    print(f"  YA EXISTE: Empleado empleado1")

# Crear un dueño de ejemplo
if not Usuario.objects.filter(username='dueno1').exists():
    dueno = Usuario.objects.create_user(
        username='dueno1',
        email='dueno@grifo.com',
        password='dueno123',
        nombre='Roberto',
        apellido='García',
        dni='87654321',
        tipo_usuario='dueno'
    )
    print(f"  CREADO: Dueño dueno1 (password: dueno123)")
else:
    print(f"  YA EXISTE: Dueño dueno1")

print("\n✅ Datos iniciales cargados correctamente!")

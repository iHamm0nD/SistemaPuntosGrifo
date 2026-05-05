import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import ProductoCanjeable

# Ajustar puntos
products_to_fix = {
    'PS5': 50000,
    'Nintendo switch': 25000,
    'Pack de Gaseosas': 150
}

for name, points in products_to_fix.items():
    p = ProductoCanjeable.objects.filter(nombre__icontains=name).first()
    if p:
        print(f"Actualizando {p.nombre} a {points} puntos")
        p.puntos_requeridos = points
        p.save()

# Revisar otros productos
for p in ProductoCanjeable.objects.all():
    print(f"Producto: {p.nombre} - Puntos: {p.puntos_requeridos}")

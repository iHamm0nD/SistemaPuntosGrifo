from rest_framework import permissions

class IsDueno(permissions.BasePermission):
    """
    Permiso que permite el acceso solo a usuarios con tipo 'dueno' o 'dev'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.tipo_usuario in ['dueno', 'dev']
        )

class IsEmpleado(permissions.BasePermission):
    """
    Permiso que permite el acceso a empleados, dueños y devs.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.tipo_usuario in ['empleado', 'dueno', 'dev']
        )

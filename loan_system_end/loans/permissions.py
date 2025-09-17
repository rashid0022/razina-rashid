from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Only owner or admin/staff can view/edit.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, 'is_admin', False):
            return True
        if hasattr(obj, 'applicant'):
            return obj.applicant == request.user
        if hasattr(obj, 'loan'):
            return obj.loan.applicant == request.user
        return False

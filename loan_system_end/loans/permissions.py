from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow only the owner of an object or admin users to access/edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Admin users or custom is_admin can do anything
        if request.user.is_staff or getattr(request.user, 'is_admin', False):
            return True

        # Check kama ni owner wa LoanApplication
        if hasattr(obj, 'applicant'):
            return obj.applicant == request.user

        # Check kama ni owner wa Payment
        if hasattr(obj, 'loan'):
            return obj.loan.applicant == request.user

        # Default deny
        return False

# loans/permissions.py
from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow only the owner of an object or admin users to access/edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Admin users can do anything
        if request.user.is_staff:
            return True

        # Check if object has 'applicant' attribute (LoanApplication or User)
        if hasattr(obj, 'applicant'):
            return obj.applicant == request.user

        # Check if object has 'loan' attribute (Payment)
        if hasattr(obj, 'loan'):
            return obj.loan.applicant == request.user

        # Default deny
        return False

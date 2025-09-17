# loans/urls.py
from django.urls import path, include
from rest_framework import routers
from .views import (
    UserViewSet,
    LoanApplicationViewSet,
    PaymentViewSet,
    user_register,
    apply_loan,
    register_and_apply,
    approve_loan,  # ✅ import approve_loan
)

# ===== Router =====
router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'loans', LoanApplicationViewSet, basename='loan')
router.register(r'payments', PaymentViewSet, basename='payment')

# ===== URL patterns =====
urlpatterns = [
    path('register/', user_register, name='register'),
    path('apply-loan/', apply_loan, name='apply-loan'),
    path('register-apply/', register_and_apply, name='register-apply'),

    # ✅ Admin approve/reject loan
    path('loans/<int:loan_id>/approve/', approve_loan, name='approve-loan'),

    # Include DRF router endpoints
    path('', include(router.urls)),
]

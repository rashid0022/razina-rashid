from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoanApplicationViewSet, PaymentViewSet, user_login

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'loans', LoanApplicationViewSet, basename='loan')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('auth/login/', user_login, name='user_login'),  # Login endpoint
    path('', include(router.urls)),                     # API endpoints za users, loans, payments
]

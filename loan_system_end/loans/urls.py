from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoanApplicationViewSet, PaymentViewSet, home

# Router ya DRF
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'loans', LoanApplicationViewSet, basename='loan')
router.register(r'payments', PaymentViewSet, basename='payment')

# URL patterns
urlpatterns = [
    path('', home, name="home"),        # http://127.0.0.1:8000/api/
    path('', include(router.urls)),     # routes za DRF
]

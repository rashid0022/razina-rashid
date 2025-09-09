from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoanApplicationViewSet, PaymentViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('applications', LoanApplicationViewSet)
router.register('payments', PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

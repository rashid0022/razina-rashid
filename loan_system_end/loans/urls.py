from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'loans', views.LoanApplicationViewSet)
router.register(r'payments', views.PaymentViewSet)

urlpatterns = [
    path('csrf/', views.get_csrf_token),  # optional ndani ya /api/csrf/
    path('', include(router.urls)),
]

# loans/urls.py
from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'loans', views.LoanApplicationViewSet)
router.register(r'payments', views.PaymentViewSet)

urlpatterns = [
    # CSRF token
    path('csrf/', views.get_csrf_token),  

    # DRF routers
    path('', include(router.urls)),

    # Custom register + apply loan endpoint (function-based view)
    path('register-apply/', views.register_and_apply, name='register-apply'),
]

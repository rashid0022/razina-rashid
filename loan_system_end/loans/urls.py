# loans/urls.py
from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)  # ← HII INAHITAJI UserViewSet
router.register(r'loans', views.LoanApplicationViewSet)
router.register(r'payments', views.PaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register-apply/', views.register_and_apply, name='register-apply'),
]
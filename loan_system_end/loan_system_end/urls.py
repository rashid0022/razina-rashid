# loan_system_end/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from loans.views import home, get_csrf_token, user_login

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', ensure_csrf_cookie(home), name='home'),
    path('csrf/', get_csrf_token, name='csrf'),  # ← CSRF endpoint
    path('api/login/', user_login, name='api-login'),
    path('api/', include('loans.urls')),
]
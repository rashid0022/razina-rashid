"""
URL configuration for loan_system_end project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# loan_system_end/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from loans.views import home, get_csrf_token, user_login  # ← user_login imeongeza hapa

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', ensure_csrf_cookie(home), name='home'),
    path('csrf/', get_csrf_token, name='csrf'),          # CSRF endpoint
    path('api/login/', user_login, name='api-login'),    # Login endpoint
    path('api/', include('loans.urls')),                # DRF ViewSets
]

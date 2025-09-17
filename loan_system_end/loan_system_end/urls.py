# loan_system_end/urls.py
from django.contrib import admin
from django.urls import path, include
from loans.views import home, get_csrf_token, user_login

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),  # redirect to React app
    path('api/csrf/', get_csrf_token, name='csrf'),
    path('api/login/', user_login, name='api-login'),
    path('api/', include('loans.urls')),  # include all loans app endpoints
]
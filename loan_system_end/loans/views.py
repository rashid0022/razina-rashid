# loans/views.py
from django.shortcuts import redirect
from django.middleware.csrf import get_token
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import User, LoanApplication, Payment
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    LoanApplicationSerializer,
    PaymentSerializer,
    RegisterAndApplySerializer,
)
from .permissions import IsOwnerOrAdmin


# ================= Home view =================
@ensure_csrf_cookie
def home(request):
    """Redirect to frontend home page"""
    return redirect("http://localhost:5173")


# ================= CSRF Token =================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    """Return CSRF token for frontend"""
    token = get_token(request)
    return Response({'csrfToken': token})


# ================= Login =================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    login(request, user)

    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'phone': user.phone,
        'address': user.address,
        'profile_photo': request.build_absolute_uri(user.profile_photo.url) if user.profile_photo else None,
        'is_admin': user.is_staff or user.is_superuser,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }

    return Response({'message': 'Login successful', 'user': user_data})


# ================= User Registration =================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_register(request):
    serializer = UserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'phone': user.phone,
        'address': user.address,
        'profile_photo': request.build_absolute_uri(user.profile_photo.url) if user.profile_photo else None,
        'is_admin': user.is_staff or user.is_superuser,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }

    return Response({'message': 'User created successfully', 'user': user_data}, status=status.HTTP_201_CREATED)


# ================= Register + Apply Loan =================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_and_apply(request):
    serializer = RegisterAndApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = serializer.save()

    # Auto-login
    user = authenticate(request, username=request.data.get('username'), password=request.data.get('password'))
    if user:
        login(request, user)

    user_data = {
        'id': result['user'].id,
        'username': result['user'].username,
        'email': result['user'].email,
        'phone': result['user'].phone,
        'address': result['user'].address,
        'profile_photo': request.build_absolute_uri(result['user'].profile_photo.url) if result['user'].profile_photo else None,
        'is_admin': result['user'].is_staff or result['user'].is_superuser,
        'is_superuser': result['user'].is_superuser,
        'is_staff': result['user'].is_staff,
        'first_name': result['user'].first_name,
        'last_name': result['user'].last_name,
    }

    loan_data = LoanApplicationSerializer(result['loan_application'], context={'request': request}).data
    if result['loan_application'].sponsor_photo:
        loan_data['sponsor_photo'] = request.build_absolute_uri(result['loan_application'].sponsor_photo.url)

    return Response({'user': user_data, 'loan_application': loan_data}, status=status.HTTP_201_CREATED)


# ================= DRF ViewSets =================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admin/staff

    def list(self, request, *args, **kwargs):
        # Debug: print request user
        print("User making request:", request.user, "is_staff:", request.user.is_staff)
        return super().list(request, *args, **kwargs)


class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return LoanApplication.objects.all()
        return LoanApplication.objects.filter(applicant=user)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Payment.objects.all()
        return Payment.objects.filter(loan__applicant=user)

    def perform_create(self, serializer):
        loan_id = self.request.data.get('loan')
        try:
            if self.request.user.is_staff or self.request.user.is_superuser:
                loan = LoanApplication.objects.get(id=loan_id)
            else:
                loan = LoanApplication.objects.get(id=loan_id, applicant=self.request.user)
            serializer.save(loan=loan)
        except LoanApplication.DoesNotExist:
            raise serializers.ValidationError("Loan not found or permission denied")

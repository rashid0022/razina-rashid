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
    return redirect("http://localhost:5173")


# ================= CSRF Token =================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    token = get_token(request)
    response = Response({'csrfToken': token})
    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Credentials"] = "true"
    return response


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
    if user:
        login(request, user)

        # Build user data manually to include admin flags
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'address': user.address,
            'profile_photo': request.build_absolute_uri(user.profile_photo.url) if user.profile_photo else None,
            'is_admin': getattr(user, 'is_admin', False),
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }

        return Response({
            'message': 'Login successful',
            'user': user_data
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


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
        'is_admin': getattr(user, 'is_admin', False),
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }

    return Response({
        'message': 'User created successfully',
        'user': user_data
    }, status=status.HTTP_201_CREATED)


# ================= Register + Apply Loan =================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_and_apply(request):
    serializer = RegisterAndApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = serializer.save()

    # Auto-login after registration
    user = authenticate(
        request,
        username=request.data.get('username'),
        password=request.data.get('password')
    )
    if user:
        login(request, user)

    user_data = {
        'id': result['user'].id,
        'username': result['user'].username,
        'email': result['user'].email,
        'phone': result['user'].phone,
        'address': result['user'].address,
        'profile_photo': request.build_absolute_uri(result['user'].profile_photo.url) if result['user'].profile_photo else None,
        'is_admin': getattr(result['user'], 'is_admin', False),
        'is_superuser': result['user'].is_superuser,
        'is_staff': result['user'].is_staff,
        'first_name': result['user'].first_name,
        'last_name': result['user'].last_name,
    }

    loan_data = LoanApplicationSerializer(result['loan_application'], context={'request': request}).data
    if result['loan_application'].sponsor_photo:
        loan_data['sponsor_photo'] = request.build_absolute_uri(result['loan_application'].sponsor_photo.url)

    return Response({
        "user": user_data,
        "loan_application": loan_data
    }, status=201)


# ================= DRF ViewSets =================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff or user.is_superuser:
                return LoanApplication.objects.all()
            return LoanApplication.objects.filter(applicant=user)
        return LoanApplication.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise serializers.ValidationError("User must be logged in to apply")
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
            loan = LoanApplication.objects.get(id=loan_id, applicant=self.request.user)
            serializer.save(loan=loan)
        except LoanApplication.DoesNotExist:
            raise serializers.ValidationError("Loan not found or you don't have permission")

from django.shortcuts import redirect
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import action

from .models import User, LoanApplication, Payment
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    LoanApplicationSerializer,
    PaymentSerializer,
    RegisterAndApplySerializer,
)
from .permissions import IsOwnerOrAdmin

# ===== Home view redirects to React frontend =====
@ensure_csrf_cookie
def home(request):
    return redirect("http://localhost:5173")  # React dev server

# ===== CSRF Token View =====
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    token = get_token(request)
    response = Response({'csrfToken': token})
    
    # ✅ ADD CORS HEADERS MANUALLY
    response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
    
    return response
# ===== Login View =====
# ===== Login View =====
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        response = Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            response = Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_superuser': user.is_superuser,
                    'is_staff': user.is_staff,
                }
            })
        else:
            response = Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # ✅ ADD CORS HEADERS TO ALL RESPONSES
    response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response['Access-Control-Allow-Credentials'] = 'true'
    response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken'
    
    return response
# ===== User Registration =====
# ===== User Registration =====
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_register(request):
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        response = Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)
    else:
        response = Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # ✅ ADD CORS HEADERS
    response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response
# ===== Register + Apply Loan View =====
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_and_apply(request):
    """
    Creates user and loan application at the same time.
    Returns the new user and loan application.
    """
    serializer = RegisterAndApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = serializer.save()  # creates both User and LoanApplication

    # Auto-login the user
    user = authenticate(
        request,
        username=request.data.get('username'),
        password=request.data.get('password')
    )
    if user:
        login(request, user)

    return Response({
        "user": {"username": result['user'].username},
        "loan_application": {"id": result['loan_application'].id}
    }, status=201)

# ===== DRF ViewSets =====

# loans/views.py - HAKIKISHA UNA HII CLASS
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    # Optional: Add CORS headers
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
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
        serializer.save(applicant=self.request.user)
    
    # ✅ ADD HII FUNCTION MPYA BAADA YA CODE YAKO ILIYOPO
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff or user.is_superuser:
                return LoanApplication.objects.all()
            return LoanApplication.objects.filter(applicant=user)
        return LoanApplication.objects.none()

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
            loan = LoanApplication.objects.get(id=loan_id, applicant=self.request.user)
            serializer.save(loan=loan)
        except LoanApplication.DoesNotExist:
            raise serializers.ValidationError("Loan not found or you don't have permission")

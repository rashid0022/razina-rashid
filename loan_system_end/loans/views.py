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

# ================= Home view redirects to React frontend =================
@ensure_csrf_cookie
def home(request):
    return redirect("http://localhost:5173")

# ================= CSRF Token View =================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    token = get_token(request)
    response = Response({'csrfToken': token})
    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

# ================= Login View =================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        response = Response({'error': 'Username and password are required'},
                            status=status.HTTP_400_BAD_REQUEST)
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
            response = Response({'error': 'Invalid credentials'},
                                status=status.HTTP_401_UNAUTHORIZED)

    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

# ================= User Registration =================
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

    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

# ================= Register + Apply Loan =================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_and_apply(request):
    """
    Hii view inahakikisha:
    1️⃣ User anaundwa na password
    2️⃣ Loan application inaundwa
    3️⃣ User ana-login automatically
    4️⃣ Response inareturn user info + loan info
    """
    serializer = RegisterAndApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = serializer.save()

    # Auto-login
    user = authenticate(
        request,
        username=request.data.get('username'),
        password=request.data.get('password')
    )
    if user:
        login(request, user)

    # Hapa tunatumia 'name' field mpya au applicant.get_full_name() kama 'name' haipo
    loan = result['loan_application']
    loan_name = getattr(loan, 'name', None)  # kutumia 'name' field ikiwa ipo
    if not loan_name and loan.applicant:
        loan_name = loan.applicant.get_full_name() or loan.applicant.username

    response = Response({
        "user": {"username": result['user'].username},
        "loan_application": {
            "id": loan.id,
            "name": loan_name,
            "loanType": loan.loan_type,
            "requestedAmount": loan.requested_amount,
            "status": loan.status
        }
    }, status=201)

    response["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

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
        # Debug: print incoming data
        print("DATA RECEIVED:", self.request.data)

        # If user is authenticated, attach automatically
        if self.request.user.is_authenticated:
            serializer.save(applicant=self.request.user)
        else:
            raise serializers.ValidationError("User must be logged in to apply")

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

from django.shortcuts import redirect
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.authentication import SessionAuthentication

from .models import User, LoanApplication, Payment
from .serializers import (
    UserSerializer, UserCreateSerializer,
    LoanApplicationSerializer, PaymentSerializer,
    RegisterAndApplySerializer
)
from .permissions import IsOwnerOrAdmin

# =========================
# CSRF Exempt Authentication
# =========================
class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # skip CSRF check

# =========================
# HOME redirect to React
# =========================
@ensure_csrf_cookie
def home(request):
    return redirect("http://localhost:5173")

# =========================
# CSRF Token API
# =========================
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    """Returns fresh CSRF token."""
    return Response({'csrfToken': get_token(request)})

# =========================
# LOGIN
# =========================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([CsrfExemptSessionAuthentication])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
            }
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# =========================
# REGISTER
# =========================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([CsrfExemptSessionAuthentication])
def user_register(request):
    serializer = UserCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response({
        'message': 'User created',
        'user': {'id': user.id, 'username': user.username, 'email': user.email}
    }, status=status.HTTP_201_CREATED)

# =========================
# REGISTER + APPLY LOAN
# =========================
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([CsrfExemptSessionAuthentication])
def register_and_apply(request):
    """
    Combines register + loan apply. Applicant = created user.
    """
    serializer = RegisterAndApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    loan = serializer.save(applicant=serializer.validated_data['user'])
    return Response({
        "message": "Loan application created",
        "loan_application": {"id": loan.id}
    }, status=status.HTTP_201_CREATED)

# =========================
# APPLY LOAN (logged-in user)
# =========================
@api_view(['POST'])
@permission_classes([AllowAny])
def apply_loan(request):
    """
    Logged-in user applies for a loan. Backend uses request.user.
    """
    serializer = LoanApplicationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(applicant=request.user)
    return Response({
        'message': 'Loan application submitted',
        'loan_id': serializer.instance.id
    }, status=201)

# =========================
# APPROVE / REJECT LOAN (admin)
# =========================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_loan(request, loan_id):
    user = request.user
    if not (user.is_staff or getattr(user, 'is_admin', False)):
        return Response({"error": "Permission denied"}, status=403)

    try:
        loan = LoanApplication.objects.get(id=loan_id)
    except LoanApplication.DoesNotExist:
        return Response({"error": "Loan not found"}, status=404)

    status_value = request.data.get('status')
    approved_amount = request.data.get('approved_amount')
    interest_rate = request.data.get('interest_rate')
    term = request.data.get('term')

    if status_value not in ['approved', 'rejected', 'contract_rejected']:
        return Response({"error": "Invalid status"}, status=400)

    loan.status = status_value
    if approved_amount is not None: loan.approved_amount = approved_amount
    if interest_rate is not None: loan.interest_rate = interest_rate
    if term is not None: loan.term = term

    if status_value == 'approved' and loan.approved_amount and loan.term and loan.interest_rate:
        r = float(loan.interest_rate) / 12
        n = int(loan.term)
        P = float(loan.approved_amount)
        loan.monthly_payment = round(P * r * (1 + r) ** n / ((1 + r) ** n - 1), 2)

    loan.save()
    return Response({"message": "Loan updated", "loan_id": loan.id})

# =========================
# VIEWSETS
# =========================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ['get','post']

class LoanApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = LoanApplicationSerializer
    permission_classes = [AllowAny]   # ruhusu kila mtu bila login
    http_method_names = ['get', 'post', 'patch']
    queryset = LoanApplication.objects.all()

    def get_queryset(self):
        return LoanApplication.objects.all()

    def perform_create(self, serializer):
        serializer.save()
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    http_method_names = ['get','post']
    queryset = Payment.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'is_admin', False):
            return Payment.objects.all()
        return Payment.objects.filter(loan__applicant=user)

    def perform_create(self, serializer):
        loan_id = self.request.data.get('loan')
        try:
            if self.request.user.is_staff or getattr(self.request.user, 'is_admin', False):
                loan = LoanApplication.objects.get(id=loan_id)
            else:
                loan = LoanApplication.objects.get(id=loan_id, applicant=self.request.user)
            serializer.save(loan=loan)
        except LoanApplication.DoesNotExist:
            raise serializers.ValidationError("Loan not found or permission denied")

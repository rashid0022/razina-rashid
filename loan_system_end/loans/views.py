from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, login
from .models import User, LoanApplication, Payment
from .serializers import UserSerializer, UserCreateSerializer, LoanApplicationSerializer, PaymentSerializer
from .permissions import IsOwnerOrAdmin

# ===== Simple home view =====
def home(request):
    return HttpResponse("Welcome to Loan System Home")

# ===== Login View =====
@api_view(['POST'])
def user_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': getattr(user, 'is_admin', False)
            }
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

# ===== DRF ViewSets =====
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.is_staff or getattr(self.request.user, 'is_admin', False):
            return LoanApplication.objects.all()
        return LoanApplication.objects.filter(applicant=self.request.user)

    def create(self, request, *args, **kwargs):
        user_data = request.data.pop('user_data', None)
        
        if not user_data:
            return Response(
                {"error": "User data is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create user
            user_serializer = UserCreateSerializer(data=user_data)
            if user_serializer.is_valid():
                user = user_serializer.save()

                # Prepare loan data (remove any extra fields)
                loan_data = {k: v for k, v in request.data.items() if k not in ['user_data']}

                # Pass applicant explicitly
                loan_serializer = self.get_serializer(data=loan_data)
                if loan_serializer.is_valid():
                    loan_application = loan_serializer.save(applicant=user)
                    return Response(loan_serializer.data, status=status.HTTP_201_CREATED)
                else:
                    user.delete()
                    return Response(loan_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.is_staff or getattr(self.request.user, 'is_admin', False):
            return Payment.objects.all()
        return Payment.objects.filter(loan__applicant=self.request.user)

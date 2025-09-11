from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from .models import User, LoanApplication, Payment
from .serializers import UserSerializer, LoanApplicationSerializer, PaymentSerializer
from .permissions import IsOwnerOrAdmin

# ===== Simple home view =====
def home(request):
    return HttpResponse("Welcome to Loan System Home")

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
        if self.request.user.is_staff:
            return LoanApplication.objects.all()
        return LoanApplication.objects.filter(applicant=self.request.user)

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(loan__applicant=self.request.user)

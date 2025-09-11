# loans/serializers.py
from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField
from .models import User, LoanApplication, Payment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'address', 
            'profile_photo', 'is_admin', 'national_id'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'loan', 'amount', 'phone', 'date']

class LoanApplicationSerializer(serializers.ModelSerializer):
    applicant = serializers.PrimaryKeyRelatedField(read_only=True)  # auto assign from view
    payments = PaymentSerializer(many=True, read_only=True)
    profile_photo = Base64ImageField(required=False)
    sponsor_photo = Base64ImageField(required=False)

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'applicant', 'loan_type', 'requested_amount', 'approved_amount',
            'interest_rate', 'term', 'monthly_payment', 'remaining_balance', 'amount_paid',
            'status', 'contract_accepted',
            'profile_photo',
            'sponsor_name', 'sponsor_address', 'sponsor_national_id', 'sponsor_phone', 
            'sponsor_email', 'sponsor_photo',
            'payments', 'created_at'
        ]

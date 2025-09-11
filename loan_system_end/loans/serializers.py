# loans/serializers.py
from rest_framework import serializers
from drf_extra_fields.fields import Base64ImageField
from django.contrib.auth.hashers import make_password
from .models import User, LoanApplication, Payment

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'email', 'phone', 'address', 
            'profile_photo', 'national_id', 'first_name', 'last_name'
        ]
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'address', 
            'profile_photo', 'is_admin', 'national_id', 'first_name', 'last_name'
        ]
        read_only_fields = ['is_admin']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'loan', 'amount', 'phone', 'date']

class LoanApplicationSerializer(serializers.ModelSerializer):
    applicant = serializers.PrimaryKeyRelatedField(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    profile_photo = Base64ImageField(required=False)
    sponsor_photo = Base64ImageField(required=False)

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'applicant', 'loan_type', 'requested_amount', 'approved_amount',
            'interest_rate', 'term', 'monthly_payment', 'remaining_balance', 'amount_paid',
            'status', 'contract_accepted', 'assets_value', 'monthly_income',
            'profile_photo',
            'sponsor_name', 'sponsor_address', 'sponsor_national_id', 'sponsor_phone', 
            'sponsor_email', 'sponsor_photo',
            'payments', 'created_at'
        ]
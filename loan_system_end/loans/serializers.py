# loans/serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.core.files.base import ContentFile
import base64
from .models import User, LoanApplication, Payment

# ===== User Serializers =====
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'address', 
            'profile_photo', 'is_admin', 'national_id', 'first_name', 'last_name'
        ]
        read_only_fields = ['is_admin']

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

# ===== Loan Application Serializer =====
class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['applicant', 'created_at', 'updated_at']

# ===== Payment Serializer =====
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

# ===== Register & Apply Serializer =====
class RegisterAndApplySerializer(serializers.Serializer):
    # --- User fields ---
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()
    address = serializers.CharField()
    national_id = serializers.CharField()
    profile_photo = serializers.CharField(required=False)  # base64

    # --- Loan fields ---
    loan_type = serializers.ChoiceField(choices=LoanApplication.LOAN_TYPES)
    requested_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    assets_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)

    # --- Sponsor fields ---
    sponsor_name = serializers.CharField()
    sponsor_address = serializers.CharField()
    sponsor_national_id = serializers.CharField()
    sponsor_phone = serializers.CharField()
    sponsor_email = serializers.EmailField()
    sponsor_photo = serializers.CharField(required=False)  # base64

    def create(self, validated_data):
        # Extract photos
        profile_photo_data = validated_data.pop('profile_photo', None)
        sponsor_photo_data = validated_data.pop('sponsor_photo', None)

        # Create user
        user_data = {
            'username': validated_data['username'],
            'password': make_password(validated_data['password']),
            'email': validated_data['email'],
            'first_name': validated_data['first_name'],
            'last_name': validated_data['last_name'],
            'phone': validated_data['phone'],
            'address': validated_data['address'],
            'national_id': validated_data['national_id'],
        }
        user = User.objects.create(**user_data)

        # Save profile photo
        if profile_photo_data:
            format, imgstr = profile_photo_data.split(';base64,')
            ext = format.split('/')[-1]
            user.profile_photo.save(
                f"{user.username}_profile.{ext}",
                ContentFile(base64.b64decode(imgstr))
            )
            user.save()

        # Create loan application
        loan = LoanApplication.objects.create(
            applicant=user,
            loan_type=validated_data['loan_type'],
            requested_amount=validated_data['requested_amount'],
            assets_value=validated_data['assets_value'],
            monthly_income=validated_data['monthly_income'],
            sponsor_name=validated_data['sponsor_name'],
            sponsor_address=validated_data['sponsor_address'],
            sponsor_national_id=validated_data['sponsor_national_id'],
            sponsor_phone=validated_data['sponsor_phone'],
            sponsor_email=validated_data['sponsor_email'],
        )

        # Save sponsor photo
        if sponsor_photo_data:
            format, imgstr = sponsor_photo_data.split(';base64,')
            ext = format.split('/')[-1]
            loan.sponsor_photo.save(
                f"{user.username}_sponsor.{ext}",
                ContentFile(base64.b64decode(imgstr))
            )
            loan.save()

        return {'user': user, 'loan_application': loan}

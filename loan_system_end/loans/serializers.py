from rest_framework import serializers
from django.core.files.base import ContentFile
import base64
from django.contrib.auth.hashers import make_password
from .models import User, LoanApplication, Payment

# =========================
# User Serializers
# =========================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'address',
            'profile_photo', 'is_admin', 'national_id',
            'first_name', 'last_name'
        ]
        read_only_fields = ['is_admin']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'email', 'phone',
            'address', 'profile_photo', 'national_id',
            'first_name', 'last_name'
        ]

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

# =========================
# Loan Application Serializer
# =========================
class LoanApplicationSerializer(serializers.ModelSerializer):
    applicant = UserSerializer(read_only=True)
    applicant_name = serializers.SerializerMethodField()

    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['applicant', 'created_at']

    def get_applicant_name(self, obj):
        full_name = f"{obj.applicant.first_name} {obj.applicant.last_name}".strip()
        return full_name if full_name else obj.applicant.username

# =========================
# Payment Serializer
# =========================
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['date']

# =========================
# Register & Apply Loan Serializer
# =========================
class RegisterAndApplySerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    national_id = serializers.CharField(required=False, allow_blank=True)
    profile_photo = serializers.CharField(required=False)  # base64 optional

    # Loan fields
    loan_type = serializers.ChoiceField(choices=LoanApplication.LOAN_TYPES)
    requested_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    assets_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_income = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Sponsor fields
    sponsor_name = serializers.CharField()
    sponsor_address = serializers.CharField()
    sponsor_national_id = serializers.CharField()
    sponsor_phone = serializers.CharField()
    sponsor_email = serializers.EmailField()
    sponsor_photo = serializers.CharField(required=False)  # base64 optional

    def create(self, validated_data):
        profile_photo_data = validated_data.pop('profile_photo', None)
        sponsor_photo_data = validated_data.pop('sponsor_photo', None)

        # --- Create User ---
        user = User.objects.create(
            username=validated_data.pop('username'),
            email=validated_data.pop('email'),
            password=make_password(validated_data.pop('password')),
            first_name=validated_data.pop('first_name', ''),
            last_name=validated_data.pop('last_name', ''),
            phone=validated_data.pop('phone', ''),
            address=validated_data.pop('address', ''),
            national_id=validated_data.pop('national_id', ''),
        )

        # Save profile photo
        if profile_photo_data:
            try:
                format, imgstr = profile_photo_data.split(';base64,')
                ext = format.split('/')[-1]
                user.profile_photo.save(
                    f"{user.username}_profile.{ext}",
                    ContentFile(base64.b64decode(imgstr)),
                    save=True
                )
            except Exception:
                pass  # ili isi-crash kama base64 haipo sawa

        # --- Create Loan Application ---
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
            try:
                format2, imgstr2 = sponsor_photo_data.split(';base64,')
                ext2 = format2.split('/')[-1]
                loan.sponsor_photo.save(
                    f"{user.username}_sponsor.{ext2}",
                    ContentFile(base64.b64decode(imgstr2)),
                    save=True
                )
            except Exception:
                pass

        return loan

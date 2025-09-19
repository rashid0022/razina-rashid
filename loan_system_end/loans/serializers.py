# loans/serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.core.files.base import ContentFile
import base64
from .models import User, LoanApplication, Payment


# ===== User Serializers =====
class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'address', 
            'profile_photo', 'is_admin', 'national_id', 'first_name', 'last_name'
        ]
        read_only_fields = ['is_admin']

    def get_profile_photo(self, obj):
        if obj.profile_photo:
            return obj.profile_photo.url
        return None


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
    sponsor_photo = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'name', 'loan_type', 'requested_amount', 'approved_amount',
            'interest_rate', 'term', 'monthly_payment', 'remaining_balance',
            'amount_paid', 'status', 'contract_accepted', 'created_at',
            'assets_value', 'monthly_income',
            'sponsor_name', 'sponsor_address', 'sponsor_national_id',
            'sponsor_phone', 'sponsor_email', 'sponsor_photo'
        ]

    def get_sponsor_photo(self, obj):
        if obj.sponsor_photo:
            return obj.sponsor_photo.url
        return None

    def get_name(self, obj):
        if obj.applicant:
            return obj.applicant.get_full_name() or obj.applicant.username
        return None


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
    profile_photo = serializers.CharField(required=False, allow_null=True)  # base64

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
    sponsor_photo = serializers.CharField(required=False, allow_null=True)  # base64

    # ===== Helper: save base64 image =====
    def save_base64_image(self, instance, base64_data, filename_field, prefix):
        if base64_data:
            try:
                if ';base64,' in base64_data:
                    format, imgstr = base64_data.split(';base64,')
                else:
                    imgstr = base64_data
                    format = 'data:image/png'
                ext = format.split('/')[-1]
                getattr(instance, filename_field).save(
                    f"{prefix}_{filename_field}.{ext}",
                    ContentFile(base64.b64decode(imgstr))
                )
                instance.save()
            except Exception as e:
                print(f"Error saving image {filename_field}: {e}")

    # ===== Create method =====
    def create(self, validated_data):
        profile_photo_data = validated_data.pop('profile_photo', None)
        sponsor_photo_data = validated_data.pop('sponsor_photo', None)

        # --- Create user ---
        user = User.objects.create(
            username=validated_data['username'],
            password=make_password(validated_data['password']),
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data['phone'],
            address=validated_data['address'],
            national_id=validated_data['national_id'],
        )
        self.save_base64_image(user, profile_photo_data, 'profile_photo', user.username)

        # --- Create loan application ---
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
        self.save_base64_image(loan, sponsor_photo_data, 'sponsor_photo', user.username)

        return {'user': user, 'loan_application': loan}


# ===== Payment Serializer =====
from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'loan', 'amount', 'phone', 'date']

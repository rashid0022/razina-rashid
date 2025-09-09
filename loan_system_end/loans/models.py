from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser

# Optional: custom user
class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    phone = models.CharField(max_length=13, blank=True)
    address = models.CharField(max_length=255, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)


class LoanApplication(models.Model):
    LOAN_TYPES = [
        ('home', 'Home'),
        ('car', 'Car'),
        ('education', 'Education'),
        ('business', 'Business'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('contract_rejected', 'Contract Rejected'),
    ]

    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    requested_amount = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    interest_rate = models.FloatField(null=True, blank=True)
    term = models.IntegerField(null=True, blank=True)
    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    contract_accepted = models.BooleanField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Sponsor info
    sponsor_name = models.CharField(max_length=255, blank=True)
    sponsor_address = models.CharField(max_length=255, blank=True)
    sponsor_national_id = models.CharField(max_length=20, blank=True)
    sponsor_phone = models.CharField(max_length=13, blank=True)
    sponsor_email = models.EmailField(blank=True)
    sponsor_photo = models.ImageField(upload_to='sponsors/', blank=True, null=True)

    def __str__(self):
        return f"{self.applicant.username} - {self.loan_type}"


class Payment(models.Model):
    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    phone = models.CharField(max_length=13)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.loan} - {self.amount}"

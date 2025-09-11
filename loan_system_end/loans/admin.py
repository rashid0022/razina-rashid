from django.contrib import admin
from .models import User, LoanApplication, Payment

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'phone', 'is_admin']

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ['applicant', 'loan_type', 'requested_amount', 'status', 'created_at']
    list_filter = ['status', 'loan_type', 'created_at']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['loan', 'amount', 'phone', 'date']
    list_filter = ['date']
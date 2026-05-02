from django.contrib import admin
from django.core.mail import send_mail
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'status', 'wants_to_be_staff', 'is_verified', 'created_at')
    list_filter = ('role', 'status', 'wants_to_be_staff', 'is_verified')
    search_fields = ('email', 'full_name', 'phone')
    readonly_fields = ('created_at',)
    actions = ['approve_vendor', 'reject_vendor']

    def approve_vendor(self, request, queryset):
        for user in queryset:
            if user.wants_to_be_staff and user.status != "APPROVED":
                user.status = "APPROVED"
                user.is_staff = True
                user.save()
                send_mail(
                    subject="Vendor Approved",
                    message="Your vendor request has been approved!",
                    from_email="admin@example.com",
                    recipient_list=[user.email],
                )
        self.message_user(request, "Selected vendors have been approved.")

    approve_vendor.short_description = "Approve selected vendors"

    def reject_vendor(self, request, queryset):
        for user in queryset:
            if user.wants_to_be_staff and user.status != "REJECTED":
                user.status = "REJECTED"
                user.is_staff = False
                user.save()
                send_mail(
                    subject="Vendor Request Rejected",
                    message="Your vendor request has been rejected.",
                    from_email="admin@example.com",
                    recipient_list=[user.email],
                )
        self.message_user(request, "Selected vendors have been rejected.")

    reject_vendor.short_description = "Reject selected vendors"
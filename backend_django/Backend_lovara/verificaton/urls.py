from django.urls import path
from .views import VerifyOTPView,SendOTPView

urlpatterns = [
    path("otp/", VerifyOTPView.as_view(),name = "verify-otp"),
    path("send_otp/", SendOTPView.as_view(),name = "verify-otp"),
]
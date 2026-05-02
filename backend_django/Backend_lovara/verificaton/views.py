from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services import generate_otp, verify_otp
from Users.tasks import send_otp_email_task



class SendOTPView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")

        if not email:
            return Response({"error": "Email required"}, status=400)

        # ✅ Generate OTP in Redis
        otp = generate_otp(email)

        # ✅ Send email asynchronously using Celery
        send_otp_email_task.delay(email, otp)

        return Response({"message": "OTP sent successfully"})


class VerifyOTPView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response({"error": "Email and OTP required"}, status=400)

        valid, message = verify_otp(email, otp)

        if not valid:
            return Response({"error": message}, status=400)

        return Response({"message": "OTP verified successfully"})
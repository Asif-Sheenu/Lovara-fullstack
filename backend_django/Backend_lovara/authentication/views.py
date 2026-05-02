from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer
from Users.models import CustomUser


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer
from Users.models import CustomUser


class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        # STEP 1 — validate request
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        # STEP 2 — get authenticated user
        user = serializer.validated_data["user"]

        # STEP 3 — email verified check
        if user.role !="ADMIN" and not user.is_verified:
            return Response(
                {"error": "Please verify your email using OTP"},
                status=status.HTTP_403_FORBIDDEN
            )

        # STEP 4 — account active check
        if not user.is_active:
            return Response(
                {"error": "Account disabled"},
                status=status.HTTP_403_FORBIDDEN
            )

        # STEP 5 — vendor approval check
        if user.role == "STAFF" and user.status != "APPROVED":
            return Response(
                {"error": "Account waiting for admin approval"},
                status=status.HTTP_403_FORBIDDEN
            )

        # STEP 6 — generate tokens
        refresh = RefreshToken.for_user(user)


        print("USER ROLE:", user.role)

        return Response({
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "status": user.status,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "wants_to_be_staff": user.wants_to_be_staff,
            }
        }, status=status.HTTP_200_OK)
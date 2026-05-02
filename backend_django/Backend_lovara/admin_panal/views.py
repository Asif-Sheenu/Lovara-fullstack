from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from Users.models import CustomUser
from .serializers import AdminUserSerializer
from rest_framework.generics import ListAPIView

# Create your views here.


# ADMIN APPROVAL 

class ApproveStaffView(APIView):

    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):

        user = get_object_or_404( CustomUser, id=user_id)

        if user.role != "STAFF":
            return Response(
                {"error": "Only staff accounts can be approved"},
                status=400
            )

        user.status = "APPROVED"
        user.save()

        return Response({"message": "Staff approved successfully"})
    


class RejectStaffView(APIView):

    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):

        user = get_object_or_404(CustomUser, id=user_id)

        user.status = "REJECTED"
        user.save()

        return Response({"message": "Staff rejected"})
    


# PENDING STAFF 

class PendingStaffListView(ListAPIView):

    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return CustomUser.objects.filter(
            role="STAFF",
            status="PENDING"
        )
    


#  APPROVED STAFF  

class ApprovedStaffListView(ListAPIView):

    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return CustomUser.objects.filter(
            role="STAFF",
            status="APPROVED"
        )


# REJECTED STAFF 


class RejectedStaffListView(ListAPIView):

    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return CustomUser.objects.filter(
            role="STAFF",
            status="REJECTED"
        )
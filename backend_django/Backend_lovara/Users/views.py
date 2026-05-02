from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from .models import CustomUser
from django.db.models import Q
from rest_framework.permissions import IsAdminUser


class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                {"message": "Registration successful"},
                status=status.HTTP_201_CREATED
            )
        print(serializer.errors) 

        return Response(serializer.errors, status=400)



# all users 

class Allusers(APIView):
    def get (self,request):
        user = CustomUser.objects.filter(role="USER")
        serializer =RegisterSerializer(user,many=True)
        return Response(serializer.data)



# admin approval !        

class pending_vendors(APIView):
    def get(self,request):
        vendors = CustomUser.objects.filter(wants_to_be_staff=True,status="PENDING")
        serializer = RegisterSerializer(vendors,many =True)
        return Response(serializer.data)
    
class All_vendors(APIView):
    def get(self,request):
        vendors = CustomUser.objects.filter(is_staff=True, role ="VENDOR")
        serializer = RegisterSerializer(vendors,many =True)
        return Response(serializer.data)


# admin approval buttons 

class ApproveVendor(APIView):
    permission_classes=[IsAdminUser]

    def patch(self,request,user_id):
        try:

            vendor= CustomUser.objects.get(id=user_id)
            vendor.status ="APPROVED"
            vendor.role="VENDOR"
            vendor.is_staff=True
            vendor.wants_to_be_staff=False
            vendor.save()
            return Response({"messsage":"Vendor approval successfully completed"},status=status.HTTP_200_OK)
        
        except CustomUser.DoesNotExist:
            return Response({"error":"Vendor not found"},status=status.HTTP_404_NOT_FOUND)




class RejectVendor(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        try:
            vendor = CustomUser.objects.get(id=user_id)

            vendor.status = "REJECTED"
            vendor.wants_to_be_staff = False

            vendor.save()

            return Response(
                {"message": "Vendor rejected"},
                status=status.HTTP_200_OK
            )

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "Vendor not found"},
                status=status.HTTP_404_NOT_FOUND
            )     
from django.shortcuts import render

# Create your views here.
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import ChatRoom
from .serializers import ChatRoomSerializer

User = get_user_model()

class CreateChatRoom(APIView):

    def post(self, request):

        vendor_id = request.data.get("vendor_id")

        vendor = get_object_or_404(User, id=vendor_id)

        room, created = ChatRoom.objects.get_or_create(
            user=request.user,
            vendor=vendor
        )

        return Response({
            "room_id": room.id
        })


class UserChatRooms(APIView):

    def get(self, request):
        rooms = ChatRoom.objects.filter(user=request.user)| ChatRoom.objects.filter(vendor=request.user)
        rooms = rooms.select_related('user', 'vendor')

        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data)        
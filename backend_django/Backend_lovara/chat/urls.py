from django.urls import path
from .views import CreateChatRoom,UserChatRooms

urlpatterns = [
    path("create_room/", CreateChatRoom.as_view(), name="create-chat-room"),
    path("rooms/", UserChatRooms.as_view(), name="chat-room"),
]
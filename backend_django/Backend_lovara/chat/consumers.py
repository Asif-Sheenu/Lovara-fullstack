import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"  # ✅ Set BEFORE any early return
        self.user = self.scope["user"]

        print(f"🔌 CONNECT - User: {self.user} | Anonymous: {self.user.is_anonymous}")

        if self.user.is_anonymous:
            print("❌ Rejected anonymous user")
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        history = await self.get_chat_history()
        print(f"📜 Sending {len(history)} history messages")
        for msg in history:
            await self.send(text_data=json.dumps(msg))

    async def disconnect(self, close_code):
        # ✅ Guard — only discard if group was ever set
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")
        print(f"📨 Received: '{message}' from {self.user}")

        try:
            saved = await self.save_message(message)
            print(f"✅ Saved: {saved}")
        except Exception as e:
            print(f"❌ SAVE FAILED: {e}")
            import traceback
            traceback.print_exc()
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": saved["message"],
                "sender": saved["sender"],
                "sender_id": saved["sender_id"],
                "timestamp": saved["timestamp"],
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "sender_id": event["sender_id"],
            "timestamp": event["timestamp"],
        }))

    @database_sync_to_async
    def save_message(self, message):
        room = ChatRoom.objects.get(id=self.room_id)
        msg = ChatMessage.objects.create(
            room=room,
            sender=self.user,
            message=message
        )
        name = (
            getattr(self.user, 'business_name', None) or
            getattr(self.user, 'full_name', None) or
            self.user.username
        )
        return {
            "message": msg.message,
            "sender": name,
            "sender_id": self.user.id,
            "timestamp": msg.timestamp.isoformat(),
        }

    @database_sync_to_async
    def get_chat_history(self):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            messages = ChatMessage.objects.filter(room=room).order_by("timestamp")[:50]
            return [
                {
                    "message": m.message,
                    "sender": (
                        getattr(m.sender, 'business_name', None) or
                        getattr(m.sender, 'full_name', None) or
                        m.sender.username
                    ),
                    "sender_id": m.sender.id,
                    "timestamp": m.timestamp.isoformat(),
                }
                for m in messages
            ]
        except ChatRoom.DoesNotExist:
            return []
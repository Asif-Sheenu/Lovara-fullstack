from channels.generic.websocket import AsyncWebsocketConsumer
import json
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):

        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)

        token = params.get("token")

        if not token:
            await self.close()
            return

        try:
            access_token = AccessToken(token[0])
            user_id = access_token["user_id"]

            self.user = await database_sync_to_async(User.objects.get)(id=user_id)

        except Exception as e:

            await self.close()
            return

        self.group_name = f"user_{str(self.user.id)}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        print ("websocket hit")
        print("CONNECTED GROUP:", self.group_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr (self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        print("📥 EVENT RECEIVED:", event)
        await self.send(text_data=json.dumps({
            "message": event["message"]
        }))
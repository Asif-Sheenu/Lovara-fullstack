import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend_lovara.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import notifications.routing
import chat.routing
from chat.middleware import JWTAuthMiddleware 

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  # ✅ replace AuthMiddlewareStack
        URLRouter(
            notifications.routing.websocket_urlpatterns +
            chat.routing.websocket_urlpatterns
        )
    ),
})

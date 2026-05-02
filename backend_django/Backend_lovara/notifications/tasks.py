from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import date
from Booking.models import Booking
from Booking.services import check_weather_and_notify

import requests

@shared_task
def send_booking_notification(user_id, message=None):
    print(f"📤 Sending notification to user_{user_id}")

    if not message:
        message = "Your booking has been approved!"

    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "send_notification",
            "message": message
        }
    )


@shared_task
def send_weather_check(booking_id):
    booking = Booking.objects.get(id=booking_id)
    check_weather_and_notify(booking)
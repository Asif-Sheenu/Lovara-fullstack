from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser
from .services import send_welcome_email


@receiver(post_save, sender=CustomUser)
def send_welcome_mail(sender, instance, created, **kwargs):
    if created:
        send_welcome_email(instance)
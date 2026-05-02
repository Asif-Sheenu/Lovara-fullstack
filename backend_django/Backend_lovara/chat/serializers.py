from rest_framework import serializers
from .models import ChatRoom
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatRoomSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ["id", "user", "vendor", "user_name", "vendor_name", "created_at"]

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.username

    def get_vendor_name(self, obj):
        return obj.vendor.business_name or obj.vendor.full_name or obj.vendor.username
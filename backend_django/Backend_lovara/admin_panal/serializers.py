from rest_framework import serializers
from Users.models import CustomUser


class AdminUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "status",
            "certificate",
            "created_at"
        ]
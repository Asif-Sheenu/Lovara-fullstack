from rest_framework import serializers
from django.contrib.auth import authenticate


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    # fields sent BACK to frontend
    id = serializers.IntegerField(read_only=True)
    role = serializers.CharField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    status = serializers.CharField(read_only=True)

    def validate(self, data):
        user = authenticate(
            username=data["email"],
            password=data["password"]
        )

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        # inject user fields into serializer output
        data["id"] = user.id
        data["role"] = user.role
        data["is_staff"] = user.is_staff
        data["is_superuser"] = user.is_superuser
        data["status"] = user.status

        data["user"] = user
        return data
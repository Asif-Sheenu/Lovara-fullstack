from rest_framework import serializers
from .models import CustomUser
from verificaton.services import verify_otp, delete_otp


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True)
    certificate = serializers.SerializerMethodField() #for upload
    certificate_url = serializers.SerializerMethodField(read_only=True) #for display 

    # business_name = serializers.CharField(required=False)
    # specialty = serializers.CharField(required=False)
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "password",
            "confirm_password",
            "otp",
            "status",
            "role",
            "certificate",
            "certificate_url",
            # "business_name",
            # "specialty",
        ]

    # ✅ VALIDATION
    def validate(self, data):

        # Password match
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError(
                "Passwords do not match"
            )

        email = data["email"]
        otp = data["otp"]

        # ✅ REDIS OTP CHECK
        if not verify_otp(email, otp):
            raise serializers.ValidationError("Invalid or expired OTP")

        role = data.get("role","USER")

        if role == "ADMIN":
            raise serializers.ValidationError(
                "Admin registration not allowed"
            )

        if role == "STAFF" and not data.get("certificate"):
            raise serializers.ValidationError(
                "Staff must upload certificate"
            )

        return data

    # ✅ CREATE USER
    def create(self, validated_data):

        validated_data.pop("confirm_password")
        otp = validated_data.pop("otp")  # remove otp

        role = validated_data.get("role","USER")

        user = CustomUser.objects.create_user(
            email=validated_data["email"],
            full_name=validated_data["full_name"],
            phone=validated_data["phone"],
            role=role,
            password=validated_data["password"],
            # business_name= validated_data.get('business_name'),
            # specialty= validated_data.get('specialty')
        )

        user.certificate = validated_data.get("certificate")
        user.is_verified = True

        if user.certificate :
            user.wants_to_be_staff = True
            user.status="PENDING"

        user.save()

        delete_otp(user.email)

        return user
    


    def get_certificate_url(self, obj):
        if obj.certificate:
            return obj.certificate.url
        return None



    def get_certificate(self, obj):
        if obj.certificate:
            return obj.certificate.url
        return None   
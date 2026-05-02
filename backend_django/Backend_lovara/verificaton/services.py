from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from Users.models import CustomUser
import random


# ✅ GENERATE OTP
def generate_otp(email):

    otp = str(random.randint(100000, 999999))
    cache.set(f"otp:{email}", otp, timeout=300)

    print("OTP:", otp)
    return otp


# ✅ VERIFY OTP (REGISTRATION SAFE)
def verify_otp(email, user_otp):

    stored_otp = cache.get(f"otp:{email}")

    if not stored_otp:
        return False, "OTP expired"

    if stored_otp != user_otp:
        return False, "Invalid OTP"

    cache.delete(f"otp:{email}")

    return True, "Verified"


# ✅ DELETE OTP
def delete_otp(email):
    cache.delete(f"otp:{email}")
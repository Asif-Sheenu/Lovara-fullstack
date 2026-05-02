from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import CustomUserManager
import cloudinary.models 


class CustomUser(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = (
        ('USER', 'User'),
        ('STAFF', 'Staff'),
        ('ADMIN', 'Admin'),
    )

    STATUS_CHOICES = (
    ("PENDING", "Pending"),
    ("APPROVED", "Approved"),
    ("REJECTED", "Rejected"),
    )

    status = models.CharField(
        max_length=20,
    choices=STATUS_CHOICES,
    default="PENDING"
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=250)
    phone = models.CharField(max_length=15)

    business_name = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    specialty = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='USER'
    )

    wants_to_be_staff = models.BooleanField(default=False)

    certificate =cloudinary.models.CloudinaryField(
    "image", blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)   
    is_superuser = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name',]

    def __str__(self):
        return f"{self.email} - {self.full_name}"
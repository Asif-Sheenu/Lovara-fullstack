from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):

    def create_user(self, email, full_name, password, phone, role='USER'):
        if not email:
            raise ValueError('Email is required')

        if not password:
            raise ValueError('Password is required')
        
        if role !="ADMIN" and not phone:
            raise ValueError('phone is required')

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            full_name=full_name,
            phone=phone,
            role=role
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_staff(self, email, full_name, phone, password):
        user = self.create_user(email, full_name, password, phone, role='STAFF')
        user.is_staff = True
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, phone, password):

        user = self.create_user(
            email=email,
            full_name=full_name,
            phone=phone,
            password=password,
            role='ADMIN'
        )

        user.is_staff = True
        user.is_superuser = True
        user.status = "APPROVED"
        user.is_verified = True
        user.save(using=self._db)
        return user

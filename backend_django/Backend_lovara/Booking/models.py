from django.db import models
from Users.models import CustomUser
from VendorSide.models import VendorWorks
# Create your models here.


class Booking(models.Model):

    user = models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name="bookings")
    work = models.ForeignKey(VendorWorks,on_delete=models.CASCADE,related_name="bookings")
    vendor = models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name="received_bookings")
    service_date = models.DateField()

    status = models.CharField(max_length=20,
        choices=[
            ("PENDING","Pending"),
            ("APPROVED","Approved"),
            ("REJECTED","Rejected"),
            ("COMPLETED","Completed"),
            ("CANCELLED","Cancelled")
        ],
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} booked {self.work}"






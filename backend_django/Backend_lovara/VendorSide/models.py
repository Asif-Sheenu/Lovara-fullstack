from django.db import models
from Users.models import CustomUser
import cloudinary.models
from django.core.validators import MinValueValidator, MaxValueValidator


class VendorWorks(models.Model):

    vendor = models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name="vendor_works")
    title = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_available = models.BooleanField(default=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    def __str__(self):
        return self.title


class WorkImages(models.Model):

    work = models.ForeignKey(VendorWorks,on_delete=models.CASCADE,related_name="images")
    image_url = cloudinary.models.CloudinaryField('image',blank=True,null=True)

    def __str__(self):
        return f"Image for {self.work.title}"


class Favorites(models.Model):

    user=models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name="favorite_works")
    work = models.ForeignKey(VendorWorks,on_delete=models.CASCADE,related_name="favorites")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'work')

    def __str__(self):
        return f"{self.user} favorited {self.work}"


class Review(models.Model):

    user = models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name="reviews")
    work = models.ForeignKey(VendorWorks,on_delete=models.CASCADE,related_name="reviews")
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    

    def __str__(self):
        return f"{self.user} reviewed {self.work}"






from django.db import models
from VendorSide.models import VendorWorks

class VendorEmbedding(models.Model):
    vendor_work = models.OneToOneField(
        VendorWorks,
        on_delete=models.CASCADE,
        related_name="embedding_data"
    )

    embedding = models.JSONField()

    def __str__(self):
        return self.vendor_work.title
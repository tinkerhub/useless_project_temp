from django.db import models

# Create your models here.
from django.db import models

class SmileAnalysis(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    smile_score = models.IntegerField()
    is_symmetrical = models.BooleanField()
    has_minimal_gum = models.BooleanField()
    teeth_exposed_correctly = models.BooleanField()
    stain_free = models.BooleanField()

    def __str__(self):
        return f"Smile Analysis at {self.timestamp} - Score: {self.smile_score}"

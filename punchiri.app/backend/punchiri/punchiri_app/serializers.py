from rest_framework import serializers
from .models import SmileAnalysis

class SmileAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmileAnalysis
        fields = '__all__'


class SmileAnalysisStatsSerializer(serializers.Serializer):
    date = serializers.DateField()
    avg_score = serializers.FloatField()
    total_attempts = serializers.IntegerField()
    symmetrical_rate = serializers.FloatField()
    gum_visibility_rate = serializers.FloatField()
    teeth_exposure_rate = serializers.FloatField()
    stain_free_rate = serializers.FloatField()
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'analyses', views.SmileAnalysisViewSet, basename='analysis')

urlpatterns = [
    path('', include(router.urls)),
    path('video-feed/', views.video_feed, name='video-feed'),
    path('analyze/', views.analyze_smile, name='analyze-smile'),
]
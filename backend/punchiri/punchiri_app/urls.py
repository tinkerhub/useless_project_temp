# smile/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('detect_smile/', views.detect_smile, name='detect_smile'),
]
